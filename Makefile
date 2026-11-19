include .devkit/runtime/devkit.mk
include .devkit/runtime/toolchains.env

VISUAL_IMAGE := devkit-visual-desktop:$(DEVKIT_DESKTOP_RECIPE_HASH)
PLAYWRIGHT_CACHE := $(or $(XDG_CACHE_HOME),$(HOME)/.cache)/ms-playwright
VISUAL_MAKE = env -u MAKEFLAGS -u MFLAGS -u MAKEOVERRIDES -u GNUMAKEFLAGS $(MAKE) --no-print-directory

.PHONY: visual-setup visual

visual-setup:
	@# Validate accepted inputs/receipts and real pnpm resolution before reusing dependencies.
	@mkdir -p .devkit/cache
	@preflight_err="$$(mktemp .devkit/cache/visual-preflight.XXXXXX)" || exit 1; \
	trap 'rm -f "$$preflight_err"' EXIT; \
	if ! ( $(VISUAL_MAKE) doctor >/dev/null 2>"$$preflight_err" && \
		$(VISUAL_MAKE) exec app=playground command='node scripts/visual-ready.mjs' >/dev/null 2>"$$preflight_err" ); then \
		if ! $(VISUAL_MAKE) setup app=playground; then \
			if [ -s "$$preflight_err" ]; then \
				printf '%s\n' 'visual-setup: initial preflight failure:' >&2; \
				cat "$$preflight_err" >&2; \
			fi; \
			exit 1; \
		fi; \
		$(VISUAL_MAKE) doctor || exit 1; \
		if ! $(VISUAL_MAKE) exec app=playground command='node scripts/visual-ready.mjs'; then \
			printf '%s\n' \
				'visual-setup: renderer dependency probe still failed after make setup.' \
				'pnpm repeat install can skip missing files inside an existing node_modules tree.' \
				'Recover manually with: rm -rf node_modules apps/*/node_modules packages/*/node_modules && make setup' >&2; \
			exit 1; \
		fi; \
	fi
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
				node ./node_modules/playwright-core/cli.js install chromium --only-shell; \
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
