(() => {
  const escapeText = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const decodeText = (value) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  };

  const renderHeading = (data) => {
    const level = ["1", "2", "3", "4", "5", "6"].includes(data.level) ? data.level : "2";
    const alignment = ["left", "center", "right"].includes(data.alignment) ? data.alignment : "left";
    return `<h${level} style="text-align: ${alignment};">${escapeText(data.text)}</h${level}>`;
  };

  CMS.registerEditorComponent({
    id: "aligned-heading",
    label: "Aligned Heading",
    fields: [
      { name: "text", label: "Heading Text", widget: "string" },
      {
        name: "level",
        label: "Heading Size",
        widget: "select",
        default: "2",
        options: [
          { label: "Heading 1", value: "1" },
          { label: "Heading 2", value: "2" },
          { label: "Heading 3", value: "3" },
          { label: "Heading 4", value: "4" },
          { label: "Heading 5", value: "5" },
          { label: "Heading 6", value: "6" },
        ],
      },
      {
        name: "alignment",
        label: "Alignment",
        widget: "select",
        default: "left",
        options: [
          { label: "Left-aligned", value: "left" },
          { label: "Centered", value: "center" },
          { label: "Right-aligned", value: "right" },
        ],
      },
    ],
    pattern: /^<h([1-6]) style="text-align: (left|center|right);">([^<\r\n]*)<\/h\1>/,
    fromBlock: (match) => ({
      level: match[1],
      alignment: match[2],
      text: decodeText(match[3]),
    }),
    toBlock: renderHeading,
    toPreview: renderHeading,
  });
})();
