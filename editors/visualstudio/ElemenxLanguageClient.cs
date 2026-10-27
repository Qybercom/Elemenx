using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;

namespace Qybercom.Elemenx.VisualStudio
{
	/// <summary>
	/// The LSP client of Visual Studio takes only the content types based on code-languageserver-base, and the ones of
	/// HTML and JavaScript are not: a definition of the same name adds that base to them (the editor joins the bases of
	/// the definitions of one name).
	/// </summary>
	public static class ElemenxContentTypes
	{
		[Export]
		[Name("html")]
		[BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
		internal static ContentTypeDefinition Html;

		[Export]
		[Name("htmlx")]
		[BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
		internal static ContentTypeDefinition HtmlX;

		[Export]
		[Name("JavaScript")]
		[BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
		internal static ContentTypeDefinition JavaScript;

		[Export]
		[Name("TypeScript")]
		[BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
		internal static ContentTypeDefinition TypeScript;
	}

	/// <summary>
	/// The language server of Elemenx in Visual Studio: Node runs the server the extension carries
	/// (server/elemenx-language-server.js, its core beside it), for the templates (HTML) and the code (JavaScript).
	/// ELEMENX_NODE names another Node than the node of PATH.
	/// </summary>
	[ContentType("html")]
	[ContentType("htmlx")]
	[ContentType("JavaScript")]
	[ContentType("TypeScript")]
	[Export(typeof(ILanguageClient))]
	public class ElemenxLanguageClient : ILanguageClient
	{
		public string Name => "Elemenx";

		public IEnumerable<string> ConfigurationSections => null;

		public object InitializationOptions => null;

		public IEnumerable<string> FilesToWatch => null;

		public bool ShowNotificationOnInitializeFailed => true;

		public event AsyncEventHandler<EventArgs> StartAsync;

		public event AsyncEventHandler<EventArgs> StopAsync;

		/// <summary>The process of the server, over its standard input and output.</summary>
		public Task<Connection> ActivateAsync(CancellationToken token)
		{
			var folder = Path.GetDirectoryName(typeof(ElemenxLanguageClient).Assembly.Location);
			var server = Path.Combine(folder, "server", "elemenx-language-server.js");
			var info = new ProcessStartInfo
			{
				FileName = Environment.GetEnvironmentVariable("ELEMENX_NODE") ?? "node",
				Arguments = "\"" + server + "\" --stdio",
				WorkingDirectory = Path.GetDirectoryName(server),
				RedirectStandardInput = true,
				RedirectStandardOutput = true,
				UseShellExecute = false,
				CreateNoWindow = true
			};
			var process = Process.Start(info);

			return Task.FromResult(new Connection(process.StandardOutput.BaseStream, process.StandardInput.BaseStream));
		}

		public async Task OnLoadedAsync()
		{
			if (StartAsync != null)
				await StartAsync.InvokeAsync(this, EventArgs.Empty);
		}

		public Task OnServerInitializedAsync() => Task.CompletedTask;

		public Task<InitializationFailureContext> OnServerInitializeFailedAsync(ILanguageClientInitializationInfo initializationState)
		{
			return Task.FromResult(new InitializationFailureContext
			{
				FailureMessage = "Elemenx: the language server did not start. It needs Node.js in PATH (or ELEMENX_NODE). " + initializationState.InitializationException?.Message
			});
		}
	}
}
