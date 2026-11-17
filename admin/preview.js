(() => {
  CMS.registerPreviewStyle("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap");
  CMS.registerPreviewStyle("/style.css?v=149");
  CMS.registerPreviewStyle("body.has-wallpaper .cms-preview-content > footer { background-color: var(--bg-color); }", { raw: true });

  const pageNames = [
    "home", "about", "available-puppies", "preparing-our-puppies",
    "testimonials", "former-puppies", "faq", "payment-options",
    "shipping-options", "recommended-products", "contact", "cavapoos",
    "retired-dogs",
  ];
  const markdown = window.markdownit({ html: true, typographer: true }).disable(["code", "replacements"]);

  const loadData = () => {
    return fetch("/admin/preview-data.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error(`Preview data request failed: ${response.status}`);
      return response.json();
    });
  };

  function resolveImages(value, getAsset, key) {
    if (Array.isArray(value)) return value.map((item) => resolveImages(item, getAsset, key));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([name, item]) => [
        name, resolveImages(item, getAsset, name),
      ]));
    }
    if (typeof value === "string" && value && /^(image|.*_image|.*_photo|photo|photos|former_puppy_photos|wallpaper)$/.test(key)) {
      return getAsset(value).toString();
    }
    return value;
  }

  function renderPreview(data, entry, name, getAsset, themePage, litterIndex) {
    const savedPage = data.pages.find((page) => page.url === (name === "home" ? "/" : `/${name}.html`));
    const values = resolveImages(entry.get("data").toJS(), getAsset, "");
    const site = JSON.parse(JSON.stringify(data.site));
    let page;

    if (name === "litter-format") {
      site.data.litter_format = values;
      const sample = site.litters.find((litter) => litter.mother_photo && litter.father_photo) || {};
      page = {
        layout: "litter", breed: "bernedoodles", url: "/litters/format-example.html",
        name: "Bernedoodle Type", mother_name: "Parent Names", father_name: "Parent Names",
        mother_photo: sample.mother_photo, father_photo: sample.father_photo,
        mother_description: "Parent details", father_description: "Parent details",
        ready_to_go_home: "Ready to go home date", estimated_weight: "Estimated weight:",
        birthday: "B-day date",
        puppies: [{ name: "Puppy Name", color: "Puppy Color/Gender", price: "Price" }],
      };
    } else if (name === "global-theme") {
      site.data.site_design = values;
      page = { ...data.pages.find((item) => item.url === (themePage === "bernedoodles" ? "/bernedoodles.html" : "/")) };
    } else if (name === "all-bernedoodles") {
      page = { ...data.pages.find((item) => item.url === "/bernedoodles.html"), ...values };
      site.litters = site.litters.filter((litter) => litter.breed !== "bernedoodles").concat(
        (values.litters || []).map((litter, index) => ({
          ...litter,
          display_order: index,
          layout: "litter",
          breed: "bernedoodles",
          show_puppy_details: true,
          url: `/litters/${litter.slug}.html`,
        }))
      );
      site.collections = site.collections.map((collection) => collection.label === "litters"
        ? { ...collection, docs: site.litters }
        : collection);
      site.collections = site.collections.map((collection) => collection.label === "pages"
        ? { ...collection, docs: collection.docs.map((item) => item.url === "/bernedoodles.html" ? page : item) }
        : collection);
      if (litterIndex !== "all") {
        const selected = site.litters.filter((litter) => litter.breed === "bernedoodles")[Number(litterIndex)];
        if (selected) page = selected;
      }
    } else if (name === "litters") {
      const slug = entry.get("slug") || "new-litter";
      page = { ...values, url: `/litters/${slug}.html`, layout: "litter" };
    } else {
      page = { ...savedPage, ...values, url: name === "home" ? "/" : `/${name}.html` };
    }

    const engine = new window.liquidjs.Liquid({
      templates: data.templates,
      jekyllInclude: true,
      dynamicPartials: false,
      strictFilters: true,
    });
    engine.registerFilter("relative_url", (value) => value || "");
    engine.registerFilter("markdownify", (value) => markdown.render(value || ""));
    engine.registerFilter("newline_to_br", (value) => String(value || "").replace(/\r?\n/g, "<br />\n"));
    engine.registerFilter("uri_escape", (value) => encodeURI(value || ""));
    engine.registerFilter("sort_natural", (items, property) => (items || []).slice().sort((a, b) => {
      const left = a[property];
      const right = b[property];
      if (left == null) return right == null ? 0 : 1;
      if (right == null) return -1;
      const leftText = String(left).toLowerCase();
      const rightText = String(right).toLowerCase();
      return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
    }));

    const context = { page, site };
    let content = "";
    if (page.layout === "litter") {
      content = engine.parseAndRenderSync(data.layouts.litter.replace(/^---[\s\S]*?---/, ""), context);
    } else {
      content = markdown.render(engine.parseAndRenderSync(page.body || "", context));
    }
    const layout = page.layout === "home" ? data.layouts.home : data.layouts.page;
    const html = engine.parseAndRenderSync(layout, { ...context, content });
    const document = new DOMParser().parseFromString(html, "text/html");
    if (name === "litter-format") {
      document.querySelectorAll(".puppy-parent__bio").forEach((details) => { details.open = true; });
      document.querySelector(".puppy-details__weight").textContent = "Estimated weight";
    }
    return {
      html: document.body.innerHTML,
      className: document.body.className,
      alignment: document.body.getAttribute("data-heading-alignment"),
      theme: document.head.querySelector("style")?.textContent || "",
    };
  }

  function makePreview(name) {
    return createClass({
      getInitialState() {
        return { data: null, error: null, themePage: "bernedoodles", imageStatus: "empty", litterIndex: "all" };
      },
      componentDidMount() {
        this.mounted = true;
        this.checkSeasonalImage();
        loadData().then((data) => {
          if (this.mounted) this.setState({ data });
        }).catch((error) => {
          console.error("Could not load content preview:", error);
          if (this.mounted) this.setState({ error: error.message });
        });
      },
      componentDidUpdate() {
        this.checkSeasonalImage();
        if (name === "all-bernedoodles" && this.state.litterIndex !== "all") {
          const litters = this.props.entry.getIn(["data", "litters"]);
          if (!litters || Number(this.state.litterIndex) >= litters.size) {
            this.setState({ litterIndex: "all" });
          }
        }
      },
      checkSeasonalImage() {
        if (name !== "global-theme") return;
        const value = this.props.entry.getIn(["data", "seasonal_image"]);
        const url = value ? this.props.getAsset(value).toString() : "";
        if (url === this.seasonalUrl) return;
        this.seasonalUrl = url;
        if (!url) {
          this.setState({ imageStatus: "empty" });
          return;
        }
        this.setState({ imageStatus: "loading" });
        const image = new Image();
        image.onload = () => {
          if (this.mounted && this.seasonalUrl === url) this.setState({ imageStatus: "loaded" });
        };
        image.onerror = () => {
          if (this.mounted && this.seasonalUrl === url) this.setState({ imageStatus: "error" });
        };
        image.src = url;
      },
      componentWillUnmount() {
        this.mounted = false;
        if (this.metricsObserver) this.metricsObserver.disconnect();
        if (this.mobileMedia) this.mobileMedia.removeEventListener("change", this.syncPreviewMenu);
        if (this.previewBody) {
          this.previewBody.classList.remove("has-wallpaper", "recommended-products-page-body");
          this.previewBody.removeAttribute("data-heading-alignment");
        }
      },
      syncPreviewMenu() {
        if (this.previewMenu) {
          this.previewMenu.open = !this.mobileMedia.matches;
          this.previewMenu.querySelectorAll(".nav-dropdown__menu .nav-dropdown > details[data-current-section]").forEach((section) => {
            section.open = !this.mobileMedia.matches;
          });
        }
      },
      updateFormatMetrics() {
        if (!this.previewElement) return;
        const doc = this.previewElement.ownerDocument;
        const rootSize = parseFloat(doc.defaultView.getComputedStyle(doc.documentElement).fontSize);
        const textUnit = parseFloat(doc.defaultView.getComputedStyle(doc.body).fontSize);
        const selectors = {
          parent_name: ".puppy-parent__details h3", parent_role: ".puppy-parent__role",
          parent_details: ".puppy-parent__description", litter_type: ".puppy-details h2",
          ready_date: ".puppy-details__availability", estimated_weight: ".puppy-details__weight",
          birthday: ".puppy-details__birthday", puppy_name: ".puppy-litter__puppy-details h3",
          puppy_color: ".puppy-litter__puppy-color", puppy_price: ".puppy-litter__puppy-price",
        };
        const keys = Object.keys(selectors);
        const elements = keys.map((key) => this.previewElement.querySelector(selectors[key]));
        if (elements.some((element) => !element)) return;
        const metrics = {};
        const rounded = (value) => Math.round(value * 10000) / 10000;
        elements.forEach((element, index) => {
          metrics[`font_${keys[index]}`] = rounded(parseFloat(doc.defaultView.getComputedStyle(element).fontSize) / textUnit);
          if (index) {
            const previous = elements[index - 1].getBoundingClientRect();
            const current = element.getBoundingClientRect();
            metrics[`space_${keys[index]}`] = rounded(Math.max(0, current.top - previous.bottom) / rootSize);
          }
        });
        window.dispatchEvent(new CustomEvent("litter-format-metrics", { detail: metrics }));
      },
      render() {
        if (this.state.error) return h("p", null, `Preview unavailable: ${this.state.error}`);
        if (!this.state.data) return h("p", null, "Loading site preview...");
        try {
          const entryLitters = name === "all-bernedoodles" ? this.props.entry.getIn(["data", "litters"]) : null;
          const litters = entryLitters ? entryLitters.toJS() : [];
          const selectedLitter = this.state.litterIndex !== "all" && Number(this.state.litterIndex) < litters.length
            ? this.state.litterIndex : "all";
          const preview = renderPreview(this.state.data, this.props.entry, name, this.props.getAsset, this.state.themePage, selectedLitter);
          return h("div", {
            ref: (element) => {
              if (!element) return;
              if (name === "litter-format") {
                this.previewElement = element;
                if (!this.metricsObserver && "ResizeObserver" in window) {
                  this.metricsObserver = new ResizeObserver(this.updateFormatMetrics);
                  this.metricsObserver.observe(element);
                }
                requestAnimationFrame(this.updateFormatMetrics);
              }
              const body = element.ownerDocument.body;
              this.previewBody = body;
              if (!this.mobileMedia) {
                this.mobileMedia = element.ownerDocument.defaultView.matchMedia("(max-width: 45rem)");
                this.mobileMedia.addEventListener("change", this.syncPreviewMenu);
              }
              const menu = element.querySelector(".mobile-nav");
              if (menu !== this.previewMenu) {
                this.previewMenu = menu;
                this.syncPreviewMenu();
              }
              body.classList.toggle("has-wallpaper", preview.className.includes("has-wallpaper"));
              body.classList.toggle("recommended-products-page-body", preview.className.includes("recommended-products-page-body"));
              if (preview.alignment) body.setAttribute("data-heading-alignment", preview.alignment);
              else body.removeAttribute("data-heading-alignment");
            },
          }, h("style", null, preview.theme), name === "litter-format" && h("p", { style: { padding: "0.5rem", background: "#fff", color: "#222" } }, "Fixed examples: adjust formatting and spacing in the left panel."),
          name === "all-bernedoodles" && h("div", {
            style: { padding: "0.5rem", background: "#fff", color: "#222" },
          }, h("label", null, "Preview page: ", h("select", {
            value: selectedLitter,
            onChange: (event) => this.setState({ litterIndex: event.target.value }),
          }, h("option", { value: "all" }, "All Bernedoodles"),
          ...litters.map((litter, index) => h("option", { key: index, value: String(index) },
            litter.mother_name ? `${litter.mother_name}'s puppies` : `Puppies ${index + 1}`)))),
          h("p", { style: { margin: "0.5rem 0" } }, "Edit all puppies in the fields on the left; this selector only changes the preview.")),
          name === "global-theme" && h("div", {
            style: { padding: "0.5rem", background: "#fff", color: "#222" },
          }, h("label", null, "Preview page: ", h("select", {
            value: this.state.themePage,
            onChange: (event) => this.setState({ themePage: event.target.value }),
          }, h("option", { value: "bernedoodles" }, "Bernedoodles"), h("option", { value: "home" }, "Home"))),
          h("p", { style: { margin: "0.5rem 0" } }, "Seasonal separator preview:"),
          h("div", { className: "puppy-litter__separator", style: { width: "100%", margin: 0 } }),
          h("p", { role: "status", style: { margin: "0.5rem 0" } },
            this.state.imageStatus === "error"
              ? "The seasonal image could not be loaded. Choose an available image or check the image URL."
              : this.state.imageStatus === "loading"
                ? "Loading seasonal image..."
                : this.state.imageStatus === "empty"
                  ? "No seasonal image selected; separators use Brand Green."
                  : "Seasonal image loaded. Text banners remain solid green.")), h("div", {
            className: "cms-preview-content",
            dangerouslySetInnerHTML: { __html: preview.html },
          }));
        } catch (error) {
          console.error("Could not render content preview:", error);
          return h("p", null, `Preview unavailable: ${error.message}`);
        }
      },
    });
  }

  pageNames.concat(["litters", "global-theme", "all-bernedoodles", "litter-format"]).forEach((name) =>
    CMS.registerPreviewTemplate(name, makePreview(name)));
})();
