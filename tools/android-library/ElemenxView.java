package __PACKAGE__;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.ScriptHandler;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * The interface of an Elemenx Application in a view of an Android program of its own (elemenx build --native
 * android-library). The Application comes from the assets of this module (assets/elemenx) at
 * https://appassets.androidplatform.net/, so its absolute paths, its Router, fetch and its workers work as from a
 * server; a link out of it opens in the program of the system for its scheme, of the schemes allowed alone
 * (setSchemes; http, https, mailto, tel, sms, geo and market by default, Native.Android.Schemes of the build).
 *
 * The program answers the Application: handle(name, call) gives the result of a call of the Platform Service of
 * ElemenxUI by its name (Platform.Ask, and the features of the Service: message, external...), handleAsync(name, call)
 * answers later by its reply; emit(name, value) is an event of the Platform Service (Platform.On). setFeatures(names)
 * are the features the Service tells it has (Platform.Has). A call without a handler the Service does as on the web.
 *
 * The door of the page to the program is a listener of messages (WebViewCompat.addWebMessageListener) for the origin of
 * the Application alone: a frame of another origin in the page (an advert, a video, a widget) has no door at all. Its
 * features and the names of its handlers are in the page before its scripts (addDocumentStartJavaScript), one
 * registered later comes to it by a message. A WebView without listeners of messages (older than 2020) has no door:
 * the Application runs as on the web.
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

	/** The schemes a link out of the Application may open by default (intent, file, content and javascript never). */
	public static final String[] SCHEMES = {__SCHEMES__};

	/** A scheme no link opens, whatever the program allows: they reach into the system, not to a page. */
	private static final List<String> NEVER = Arrays.asList("intent", "file", "content", "javascript", "data", "blob");

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
	private final Set<String> schemes = new LinkedHashSet<>(Arrays.asList(SCHEMES));
	/** The frames of the Application that opened the door: the events and the names of new handlers go to them. */
	private final List<JavaScriptReplyProxy> frames = new ArrayList<>();
	private final Handler main = new Handler(Looper.getMainLooper());
	private WebViewAssetLoader loader;
	private ScriptHandler state;
	private boolean door;

	public ElemenxView(@NonNull Context context) {
		this(context, null);
	}

	public ElemenxView(@NonNull Context context, @Nullable AttributeSet attributes) {
		super(context, attributes);

		setup();
	}

	@SuppressLint("SetJavaScriptEnabled")
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
			public void onPageStarted(WebView view, String url, Bitmap favicon) {
				/* A page again: its frames open the door again. */
				frames.clear();

				super.onPageStarted(view, url, favicon);
			}

			@Override
			public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
				Uri url = request.getUrl();
				String scheme = url.getScheme() == null ? "" : url.getScheme().toLowerCase(Locale.ROOT);

				if (url.toString().startsWith(ORIGIN + "/")) return false;

				/* Regression: every scheme went to an Intent (intent:// opens any part of any program). */
				if (!schemes.contains(scheme) || NEVER.contains(scheme)) return true;

				try {
					getContext().startActivity(new Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
				}
				catch (Exception error) {
					return true;
				}

				return true;
			}
		});

		/*
		 * Regression: a JavaScript interface gave the door to every frame, a frame of another origin too, and the check of
		 * getUrl() read the page, not the frame that called.
		 */
		if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;

		door = true;

		WebViewCompat.addWebMessageListener(this, "ElemenxAndroid", Collections.singleton(ORIGIN), new WebViewCompat.WebMessageListener() {
			@Override
			public void onPostMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri origin, boolean top, @NonNull JavaScriptReplyProxy reply) {
				heard(message.getData(), reply);
			}
		});

		told();
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

		told();

		return this;
	}

	public ElemenxView setFeatures(@NonNull String... names) {
		features.clear();
		features.addAll(Arrays.asList(names));

		told();

		return this;
	}

	/** The schemes a link out of the Application may open (intent, file, content, javascript, data and blob never). */
	public ElemenxView setSchemes(@NonNull String... names) {
		schemes.clear();

		for (String name : names) {
			if (!NEVER.contains(name.toLowerCase(Locale.ROOT)))
				schemes.add(name.toLowerCase(Locale.ROOT));
		}

		return this;
	}

	/** An event of the Platform Service (Platform.On(name, callback)) with its value: to the frames of the Application. */
	public void emit(@NonNull final String name, @Nullable final Object value) {
		post("{\"Type\":\"event\",\"Name\":" + JSONObject.quote(name) + ",\"Value\":" + json(value) + "}");
	}

	/** What the page knows before its scripts: its features and the names of the handlers; to the frames open, at once. */
	private void told() {
		if (!door) return;

		final String known = state();

		main.post(new Runnable() {
			@Override
			public void run() {
				if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
					if (state != null)
						state.remove();

					state = WebViewCompat.addDocumentStartJavaScript(ElemenxView.this, "window.ElemenxAndroidState = " + known + ";", Collections.singleton(ORIGIN));
				}

				send("{\"Type\":\"state\",\"State\":" + known + "}");
			}
		});
	}

	private String state() {
		JSONObject made = new JSONObject();

		try {
			made.put("Features", new JSONArray(features));
			made.put("Handlers", new JSONArray(handlers.keySet()));
		}
		catch (Exception error) {
			return "{\"Features\":[],\"Handlers\":[]}";
		}

		return made.toString();
	}

	private void post(final String message) {
		main.post(new Runnable() {
			@Override
			public void run() {
				send(message);
			}
		});
	}

	/** To every frame of the Application that opened the door (on the main thread). */
	private void send(String message) {
		for (JavaScriptReplyProxy frame : new ArrayList<>(frames))
			frame.postMessage(message);
	}

	/** A message of a frame of the Application: hello (the door opened: its state), or a call. */
	private void heard(@Nullable String data, @NonNull final JavaScriptReplyProxy reply) {
		final JSONObject message;
		final String id;
		final String name;
		AsyncCall call;

		try {
			message = new JSONObject(data == null ? "{}" : data);
		}
		catch (Exception error) {
			return;
		}

		if ("hello".equals(message.optString("Type"))) {
			if (!frames.contains(reply))
				frames.add(reply);

			reply.postMessage("{\"Type\":\"state\",\"State\":" + state() + "}");

			return;
		}

		if (!"call".equals(message.optString("Type"))) return;

		id = message.optString("ID");
		name = message.optString("Name");
		call = handlers.get(name);

		if (call == null) {
			answer(reply, id, "Elemenx Native has no handler of " + name + " in the program", null);

			return;
		}

		try {
			JSONObject args = message.optJSONObject("Args");

			call.handle(args == null ? new JSONObject() : args, new Reply() {
				@Override
				public void resolve(@Nullable Object value) {
					answer(reply, id, null, value);
				}

				@Override
				public void reject(@NonNull String text) {
					answer(reply, id, text, null);
				}
			});
		}
		catch (Exception error) {
			answer(reply, id, error.getMessage() == null ? error.toString() : error.getMessage(), null);
		}
	}

	/** The answer to a call, to the frame that made it (on the main thread). */
	private void answer(final JavaScriptReplyProxy reply, String id, @Nullable String error, @Nullable Object value) {
		final String text = "{\"Type\":\"reply\",\"ID\":" + JSONObject.quote(id) + ",\"Error\":" + (error == null ? "null" : JSONObject.quote(error)) + ",\"Value\":" + json(value) + "}";

		main.post(new Runnable() {
			@Override
			public void run() {
				reply.postMessage(text);
			}
		});
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
}
