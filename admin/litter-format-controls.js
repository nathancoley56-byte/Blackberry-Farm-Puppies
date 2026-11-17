(() => {
  const metricsEvent = "litter-format-metrics";
  const defaults = {};

  const RemInput = createClass({
    getInitialState() {
      return { edit: null, invalid: false };
    },
    change(text) {
      if (this.props.allowNegative && (text === "" || text === "-" || text === "." || text === "-.")) {
        this.setState({ edit: text, invalid: text !== "" });
        return;
      }
      const value = Number(text);
      const invalid = text !== "" && (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(value) || value < this.props.min || value > this.props.max);
      this.setState({ edit: this.props.allowNegative || invalid ? text : null, invalid });
      if (!invalid) this.props.onChange(text === "" ? null : value);
    },
    finishEditing() {
      if (!this.props.allowNegative) return;
      if (this.state.edit === "") this.props.onChange(null);
      if (this.state.invalid) return;
      this.setState({ edit: null });
    },
    adjust(amount) {
      const value = this.props.value == null ? this.props.defaultValue : this.props.value;
      if (value == null) return;
      this.change(String(Math.min(this.props.max, Math.max(this.props.min, Math.round((Number(value) + amount) * 10000) / 10000))));
    },
    render() {
      const value = this.state.edit !== null ? this.state.edit : this.props.value == null ? this.props.defaultValue : this.props.value;
      return h("div", null,
        h("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" } },
          h("button", { type: "button", "aria-label": `Decrease ${this.props.label}`, onClick: () => this.adjust(-0.125) }, "\u2193"),
          h("input", {
            id: this.props.id, type: this.props.allowNegative ? "text" : "number", inputMode: "decimal",
            role: this.props.allowNegative ? "spinbutton" : undefined,
            "aria-valuemin": this.props.allowNegative ? this.props.min : undefined,
            "aria-valuemax": this.props.allowNegative ? this.props.max : undefined,
            "aria-valuenow": this.props.allowNegative && value !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined,
            min: this.props.min, max: this.props.max, step: "any",
            value: value == null ? "" : value, "aria-label": `${this.props.label} (rem)`,
            "aria-invalid": this.state.invalid, style: { width: "6rem" },
            onChange: (event) => this.change(event.target.value),
            onBlur: this.finishEditing,
            onKeyDown: (event) => {
              if (!this.props.allowNegative || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
              event.preventDefault();
              this.adjust(event.key === "ArrowUp" ? 0.125 : -0.125);
            },
          }),
          h("button", { type: "button", "aria-label": `Increase ${this.props.label}`, onClick: () => this.adjust(0.125) }, "\u2191"),
          h("span", null, "rem"),
          this.props.value != null && h("button", { type: "button", onClick: () => { this.setState({ edit: null, invalid: false }); this.props.onChange(null); } }, "Use default")),
        this.props.value == null && h("small", null, value == null ? "Loading current preview value..." : "Current preview default"),
        this.state.invalid && h("span", { role: "alert" }, ` Enter a value from ${this.props.min} to ${this.props.max} rem.`));
    },
  });

  const withMetrics = {
    getInitialState() { return { metrics: defaults }; },
    componentDidMount() { window.addEventListener(metricsEvent, this.receiveMetrics); },
    componentWillUnmount() { window.removeEventListener(metricsEvent, this.receiveMetrics); },
    receiveMetrics(event) { this.setState({ metrics: event.detail }); },
  };
  const readValue = (value) => value && typeof value.toJS === "function" ? value.toJS() : { ...(value || {}) };

  CMS.registerWidget("litter-spacing", createClass({ render() { return null; } }));

  CMS.registerWidget("litter-format-section", createClass({
    ...withMetrics,
    change(key, value) {
      const data = readValue(this.props.value);
      if (value == null) delete data[key];
      else data[key] = value;
      if (key === "font_size_rem") delete data.font_size;
      this.props.onChange(data);
    },
    render() {
      const data = readValue(this.props.value);
      const key = this.props.field.get("name");
      const size = data.font_size_rem != null ? data.font_size_rem : data.font_size != null ? Number(data.font_size) / 16 : null;
      return h("div", { className: this.props.classNameWrapper },
        h("label", { htmlFor: this.props.forID }, "Font size"),
        h(RemInput, { id: this.props.forID, label: `${this.props.field.get("label")} font size`, value: size,
          defaultValue: this.state.metrics[`font_${key}`], min: 0.625, max: 4.5, onChange: (value) => this.change("font_size_rem", value) }),
        h("label", { style: { display: "block", marginTop: "0.5rem" } },
          h("input", { type: "checkbox", checked: data.bold === true, onChange: (event) => this.change("bold", event.target.checked) }), " Bold"),
        h("label", { style: { display: "block", marginTop: "0.5rem" } }, "Alignment ",
          h("select", { value: data.alignment || "default", onChange: (event) => this.change("alignment", event.target.value) },
            h("option", { value: "default" }, "Page default"), h("option", { value: "left" }, "Left"),
            h("option", { value: "center" }, "Center"), h("option", { value: "right" }, "Right"))));
    },
  }));

  CMS.registerWidget("litter-space", createClass({
    ...withMetrics,
    render() {
      const key = this.props.field.get("name");
      return h(RemInput, { id: this.props.forID, label: this.props.field.get("label").replace(" (rem)", ""),
        value: this.props.value, defaultValue: this.state.metrics[key], min: -5, max: 10, allowNegative: true, onChange: this.props.onChange });
    },
  }));

  CMS.registerWidget("litter-photos", createClass({
    change(key, value) {
      const data = readValue(this.props.value);
      data[key] = value == null ? (key === "width_rem" ? 16.74 : 1.395) : value;
      if (data.width_rem == null) data.width_rem = 16.74;
      if (data.gap_rem == null) data.gap_rem = 1.395;
      this.props.onChange(data);
    },
    render() {
      const data = readValue(this.props.value);
      return h("div", null,
        h("label", null, "Maximum photo width"),
        h(RemInput, { label: "Parent photo width", value: data.width_rem, defaultValue: 16.74, min: 3, max: 40,
          onChange: (value) => this.change("width_rem", value) }),
        h("label", null, "Maximum space between photos"),
        h(RemInput, { label: "Parent photo spacing", value: data.gap_rem, defaultValue: 1.395, min: 0, max: 20,
          onChange: (value) => this.change("gap_rem", value) }),
        h("small", null, "Photos and their spacing shrink together on narrow screens."));
    },
  }));
})();
