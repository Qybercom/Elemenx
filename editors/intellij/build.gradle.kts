/*
 * The plugin of Elemenx for the IDEs of JetBrains (IntelliJ IDEA, WebStorm, PhpStorm...): the language server of
 * ../server through LSP4IJ. The server, its core and the meta.json of ElemenxUI go into the resources of the plugin.
 * Built against an IDE of the machine with -PideaLocal=<its folder>, or against the one it names below; tested
 * against IntelliJ IDEA Community (gradlew test -PideaCommunity=2025.2.6.3) and WebStorm, for the JavaScript of the
 * expressions (gradlew test -Pwebstorm=2026.2.3).
 */
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.intellij.platform.gradle.TestFrameworkType
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import groovy.json.JsonSlurper

/* commonmark: the Markdown of the description of editors/extension.json as the HTML plugin.xml takes. */
buildscript {
	repositories {
		mavenCentral()
	}

	dependencies {
		classpath("org.commonmark:commonmark:0.24.0")
	}
}

plugins {
	id("org.jetbrains.kotlin.jvm") version "2.4.21"
	id("org.jetbrains.intellij.platform") version "2.19.0"
}

group = "com.qybercom"
version = "0.10.8"

repositories {
	mavenCentral()

	intellijPlatform {
		defaultRepositories()
	}
}

dependencies {
	intellijPlatform {
		val ide = providers.gradleProperty("ideaLocal").orNull
		val community = providers.gradleProperty("ideaCommunity").orNull
		val webstorm = providers.gradleProperty("webstorm").orNull

		/* The tests run against IntelliJ IDEA Community (-PideaCommunity=2025.2.6.3): the light IDE of the tests starts there. */
		/* With -Pwebstorm=2026.2.3 they run in WebStorm: the JavaScript of the expressions, which IntelliJ IDEA Community has not. */
		if (community != null) intellijIdeaCommunity(community)
		else if (webstorm != null) webstorm(webstorm)
		else if (ide != null) local(ide)
		else intellijIdea("2026.2.3")

		plugin("com.redhat.devtools.lsp4ij:0.21.0")

		/* The tests run in a light IDE of its own: the inspections of HTML on a template. */
		testFramework(TestFrameworkType.Platform)
	}

	testImplementation("junit:junit:4.13.2")
	testImplementation("org.opentest4j:opentest4j:1.3.0")
}

java {
	sourceCompatibility = JavaVersion.VERSION_21
	targetCompatibility = JavaVersion.VERSION_21
}

/* Bytecode of Java 21, the runtime of the oldest IDE it takes, whatever JDK builds it. */
tasks.withType<KotlinCompile>().configureEach {
	compilerOptions {
		jvmTarget.set(JvmTarget.JVM_21)
	}
}

intellijPlatform {
	buildSearchableOptions = false

	/* The name, the vendor and the description of editors/extension.json, the one source of the three extensions. */
	pluginConfiguration {
		val extension = JsonSlurper().parse(file("../extension.json")) as Map<*, *>
		val vendorOf = extension["Vendor"] as Map<*, *>
		val markdown = file("../" + extension["Description"]).readText()

		name = extension["DisplayName"] as String
		description = "<p>" + extension["Summary"] + "</p>\n" + org.commonmark.renderer.html.HtmlRenderer.builder().build().render(org.commonmark.parser.Parser.builder().build().parse(markdown))

		vendor {
			name = vendorOf["Name"] as String
			url = vendorOf["Url"] as String
			(vendorOf["Email"] as String).takeIf { it.isNotEmpty() }?.let { email = it }
		}

		ideaVersion {
			sinceBuild = "243"
			untilBuild = provider { null }
		}
	}

	/*
	 * The JetBrains Marketplace (publish.yml, a release of Elemenx): the plugin signed with the certificate of the
	 * vendor, then uploaded; a prerelease version to the channel beta (-PpluginChannel=beta). The secrets come as
	 * variables of the environment; docs/EDITORS.md tells how to make them.
	 */
	signing {
		certificateChain = providers.environmentVariable("JETBRAINS_CERTIFICATE_CHAIN")
		privateKey = providers.environmentVariable("JETBRAINS_PRIVATE_KEY")
		password = providers.environmentVariable("JETBRAINS_PRIVATE_KEY_PASSWORD")
	}

	publishing {
		token = providers.environmentVariable("JETBRAINS_TOKEN")
		channels = providers.gradleProperty("pluginChannel").map { channel -> listOf(channel) }.orElse(listOf("default"))
	}
}

/* The archive without the version in its name, as the one of VS Code: the version is the one of Elemenx, in plugin.xml. */
tasks.buildPlugin {
	archiveFileName.set("elemenx-intellij.zip")
}

/* The language server and what it knows, from the folders beside the plugin. */
tasks.processResources {
	from("../core") {
		into("elemenx/core")
	}

	from("../server") {
		into("elemenx/server")
	}

	from("../../libraries/ElemenxUI/data/meta.json") {
		into("elemenx/core")
	}

	/*
	 * The sources of Elemenx and of ElemenxUI of this version: a project that has only a build of dist goes to their
	 * definitions in this copy (*if to elemenx.js, a Component to its file). files.txt lists what the plugin copies out.
	 */
	from("../../elemenx.js") {
		into("elemenx/core")
	}

	from("../../libraries/ElemenxUI") {
		include("data/meta.json", "components/**/*.js", "components/**/*.html", "directives/*.js", "services/*.js", "locales/*.json")
		into("elemenx/core/library")
	}

	doLast {
		val folder = destinationDir.resolve("elemenx")
		val list = folder.walkTopDown().filter { file -> file.isFile && file.name != "files.txt" }.map { file -> file.relativeTo(folder).invariantSeparatorsPath }.sorted().joinToString("\n")

		folder.resolve("files.txt").writeText(list + "\n")
	}
}
