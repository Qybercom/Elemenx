/*
 * The plugin of Elemenx for the IDEs of JetBrains (IntelliJ IDEA, WebStorm, PhpStorm...): the language server of
 * ../server through LSP4IJ. The server, its core and the meta.json of ElemenxUI go into the resources of the plugin.
 * Built against an IDE of the machine with -PideaLocal=<its folder>, or against the one it names below; tested
 * against IntelliJ IDEA Community: gradlew test -PideaCommunity=2025.2.6.3.
 */
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.intellij.platform.gradle.TestFrameworkType
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
	id("org.jetbrains.kotlin.jvm") version "2.4.21"
	id("org.jetbrains.intellij.platform") version "2.19.0"
}

group = "com.qybercom"
version = "1.0.2"

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

		/* The tests run against IntelliJ IDEA Community (-PideaCommunity=2025.2.6.3): the light IDE of the tests starts there. */
		if (community != null) intellijIdeaCommunity(community)
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

	pluginConfiguration {
		ideaVersion {
			sinceBuild = "243"
			untilBuild = provider { null }
		}
	}
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
}
