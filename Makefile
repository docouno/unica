include .devkit/runtime/devkit.mk
include .devkit/runtime/toolchains.env

VISUAL_IMAGE := devkit-visual-desktop:$(DEVKIT_DESKTOP_RECIPE_HASH)
PLAYWRIGHT_CACHE := $(or $(XDG_CACHE_HOME),$(HOME)/.cache)/ms-playwright

.PHONY: visual-setup visual

visual-setup:
	@# Validate accepted inputs and the installed graph before reusing dependencies.
	@DEVKIT_TARGET_COMPONENT=apps/playground sh $(devkit_loader) setup >/dev/null 2>&1 && \
		sh $(devkit_loader) exec --component apps/playground -- \
			node scripts/visual-ready.mjs >/dev/null 2>&1 || \
		$(MAKE) setup-playground
	@docker image inspect $(VISUAL_IMAGE) >/dev/null 2>&1 || \
		docker build -f .devkit/runtime/desktop.Dockerfile -t $(VISUAL_IMAGE) .devkit/runtime
	@mkdir -p "$(PLAYWRIGHT_CACHE)"
	@# Probe the installed headless shell; executablePath() points to full Chromium.
	@flock "$(PLAYWRIGHT_CACHE)/.install.lock" sh -c '\
		if ! docker run --rm --network none \
			-u "$$(id -u):$$(id -g)" \
			-e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
			-v "$$(pwd):/workspace:ro" \
			-v "$(PLAYWRIGHT_CACHE):/ms-playwright:ro" \
			-w /workspace/apps/playground \
			$(VISUAL_IMAGE) \
			node --input-type=module -e "const { chromium } = await import(\"playwright-core\"); const browser = await chromium.launch({ chromiumSandbox: false }); await browser.close();" >/dev/null 2>&1; then \
			docker run --rm --init \
				-u "$$(id -u):$$(id -g)" \
				-e HOME=/tmp/pw-home \
				-e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
				-v "$$(pwd):/workspace:ro" \
				-v "$(PLAYWRIGHT_CACHE):/ms-playwright" \
				-w /workspace/apps/playground \
				$(VISUAL_IMAGE) \
				npx --no-install playwright-core install chromium --only-shell; \
		fi'

# The renderer resolves workspace package exports to source through Vite.
visual: visual-setup
	@mkdir -p .artifacts/visual .devkit/cache/vite-visual
	@docker run --rm --init \
		--network none \
		--read-only \
		--shm-size=256m \
		--cap-drop ALL \
		--security-opt no-new-privileges:true \
		--security-opt seccomp=.devkit/runtime/desktop-seccomp.json \
		--tmpfs /tmp:rw,noexec,nosuid,size=128m \
		-u "$$(id -u):$$(id -g)" \
		-e HOME=/tmp \
		-e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
		-e VITE_CACHE_DIR=/cache/vite \
		-e VISUAL_ITEM="$(item)" \
		-e VISUAL_MODE="$(or $(mode),6up)" \
		-e VISUAL_THEME="$(or $(theme),frost-dark)" \
		-e VISUAL_SURFACE="$(or $(surface),auto)" \
		-e VISUAL_VP="$(vp)" \
		-e VISUAL_SCALE="$(or $(scale),100)" \
		-e VISUAL_DIR="$(or $(dir),ltr)" \
		-e VISUAL_SECTION="$(or $(section),all)" \
		-e VISUAL_RAW="$(or $(raw),1)" \
		-e VISUAL_OUT="$(out)" \
		-v "$$(pwd):/workspace:ro" \
		-v "$(PLAYWRIGHT_CACHE):/ms-playwright:ro" \
		-v "$$(pwd)/.devkit/cache/vite-visual:/cache/vite" \
		-v "$$(pwd)/.artifacts/visual:/workspace/.artifacts/visual" \
		-w /workspace/apps/playground \
		$(VISUAL_IMAGE) \
		node scripts/visual.mjs
