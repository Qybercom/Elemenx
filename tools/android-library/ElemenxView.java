package __PACKAGE__;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The interface of an Elemenx Application in a view of an Android program of its own (elemenx build --native
 * android-library). The Application comes from the assets of this module (assets/elemenx) at
 * https://appassets.androidplatform.net/, so its absolute paths, its Router, fetch and its workers work as from a
 * server; a link out of it opens in the browser of the system.
 *
 * The program answers the Application: handle(name, call) gives the result of a call of the Platform Service of
 * ElemenxUI by its name (Platform.Ask, and the features of the Service: message, external...), handleAsync(name, call)
 * answers later by its reply; emit(name, value) is an event of the Platform Service (Platform.On). setFeatures(names)
 * are the features the Service tells it has (Platform.Has). A call without a handler the Service does as on the web.
 *
 * <pre>
 * ElemenxView view = new ElemenxView(context);
 * view.handle("server.start", args -> server.start(args.optInt("Port", 8080)));
 * view.load();
 * </pre>
 */
public class ElemenxView extends WebView {
	/** The origin of the Application. */
	public static final String ORIGIN = "https://appassets.androidplatform.net";

	/** A call of the Application answered at once: its result (a JSONObject, a JSONArray, a Map, a List, a String, a number, a boolean or null). */
	public interface Call {
		Object handle(@NonNull JSONObject args) throws Exception;
	}

	/** A call of the Application answered later, on any thread, by its reply. */
	public interface AsyncCall {
		void handle(@NonNull JSONObject args, @NonNull Reply reply) throws Exception;
	}

	public interface Reply {
		void resolve(@Nullable Object value);

		void reject(@NonNull String message);
	}

	private final Map<String, AsyncCall> handlers = new HashMap<>();
	private final List<String> features = new ArrayList<>();
	private final Handler main = new Handler(Looper.getMainLooper());
	private WebViewAssetLoader loader;

	public ElemenxView(@NonNull Context context) {
		this(context, null);
	}

	public ElemenxView(@NonNull Context context, @Nullable AttributeSet attributes) {
		super(context, attributes);

		setup();
	}

	@SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
	private void setup() {
		WebSettings settings = getSettings();
		final WebViewAssetLoader.AssetsPathHandler assets = new WebViewAssetLoader.AssetsPathHandler(getContext());

		settings.setJavaScriptEnabled(true);
		settings.setDomStorageEnabled(true);
		settings.setAllowFileAccess(false);
		settings.setAllowContentAccess(false);

		/* The files of the Application from assets/elemenx; an address of the Router (no extension) is its page. */
		loader = new WebViewAssetLoader.Builder().addPathHandler("/", new WebViewAssetLoader.PathHandler() {
			@Nullable
			@Override
			public WebResourceResponse handle(@NonNull String path) {
				WebResourceResponse response = assets.handle("elemenx/" + path);

				if ((response == null || response.getData() == null) && path.lastIndexOf('.') <= path.lastIndexOf('/'))
					response = assets.handle("elemenx/index.html");

				return response;
			}
		}).build();

		setWebViewClient(new WebViewClient() {
			@Nullable
			@Override
			public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
				return loader.shouldInterceptRequest(request.getUrl());
			}

			@Override
			public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
				Uri url = request.getUrl();

				if (url.toString().startsWith(ORIGIN + "/")) return false;

				try {
					getContext().startActivity(new Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
				}
				catch (Exception error) {
					return true;
				}

				return true;
			}
		});

		addJavascriptInterface(new Port(), "ElemenxAndroid");
	}

	/** Loads the Application: its page, or a path of it (a route). */
	public void load() {
		load("/");
	}

	public void load(@NonNull String path) {
		loadUrl(ORIGIN + (path.startsWith("/") ? path : "/" + path));
	}

	public ElemenxView handle(@NonNull String name, @NonNull final Call call) {
		return handleAsync(name, new AsyncCall() {
			@Override
			public void handle(@NonNull JSONObject args, @NonNull Reply reply) throws Exception {
				reply.resolve(call.handle(args));
			}
		});
	}

	public ElemenxView handleAsync(@NonNull String name, @NonNull AsyncCall call) {
		handlers.put(name, call);

		return this;
	}

	public ElemenxView setFeatures(@NonNull String... names) {
		features.clear();
		features.addAll(Arrays.asList(names));

		return this;
	}

	/** An event of the Platform Service (Platform.On(name, callback)) with its value. */
	public void emit(@NonNull final String name, @Nullable final Object value) {
		run("window.ElemenxNative && window.ElemenxNative.Emit(" + JSONObject.quote(name) + ", " + json(value) + ")");
	}

	private void run(final String script) {
		main.post(new Runnable() {
			@Override
			public void run() {
				evaluateJavascript(script, null);
			}
		});
	}

	private void reply(String id, @Nullable String error, @Nullable Object value) {
		run("window.ElemenxNative && window.ElemenxNative.Reply(" + JSONObject.quote(id) + ", " + (error == null ? "null" : JSONObject.quote(error)) + ", " + json(value) + ")");
	}

	/** A value as JSON for the page. */
	private static String json(@Nullable Object value) {
		if (value == null) return "null";

		if (value instanceof JSONObject || value instanceof JSONArray) return value.toString();

		if (value instanceof String) return JSONObject.quote((String) value);

		if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);

		if (value instanceof Map) return new JSONObject((Map<?, ?>) value).toString();

		if (value instanceof Collection) return new JSONArray((Collection<?>) value).toString();

		Object wrapped = JSONObject.wrap(value);

		return wrapped == null ? "null" : wrapped instanceof String ? JSONObject.quote((String) wrapped) : wrapped.toString();
	}

	/** The door of the page to the program: the calls of the bridge (assets/elemenx/elemenx-android.js). */
	private class Port {
		@JavascriptInterface
		public String features() {
			return new JSONArray(features).toString();
		}

		@JavascriptInterface
		public boolean can(String name) {
			return handlers.containsKey(name);
		}

		@JavascriptInterface
		public void call(final String id, final String name, final String args) {
			main.post(new Runnable() {
				@Override
				public void run() {
					AsyncCall call = handlers.get(name);
					String url = getUrl();

					/* The page of the Application only: another page in the view gets no answer. */
					if (url == null || !url.startsWith(ORIGIN + "/")) return;

					if (call == null) {
						reply(id, "Elemenx Native has no handler of " + name + " in the program", null);

						return;
					}

					try {
						call.handle(args == null || args.isEmpty() ? new JSONObject() : new JSONObject(args), new Reply() {
							@Override
							public void resolve(@Nullable Object value) {
								reply(id, null, value);
							}

							@Override
							public void reject(@NonNull String message) {
								reply(id, message, null);
							}
						});
					}
					catch (Exception error) {
						reply(id, error.getMessage() == null ? error.toString() : error.getMessage(), null);
					}
				}
			});
		}
	}
}
