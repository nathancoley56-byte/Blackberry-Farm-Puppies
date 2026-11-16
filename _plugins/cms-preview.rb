require "json"

module CmsPreview
  class Generator < Jekyll::Generator
    def generate(site)
      templates = Dir.glob(File.join(site.source, "_includes", "**", "*"))
        .select { |path| File.file?(path) }
        .to_h { |path| [path.delete_prefix(File.join(site.source, "_includes") + File::SEPARATOR).tr("\\", "/"), File.read(path)] }
      layouts = site.layouts.transform_values(&:content)
      collections = site.collections.select { |label, _| %w[pages litters].include?(label) }.transform_values do |collection|
        collection.docs.map { |doc| doc.data.reject { |key, _| key == "excerpt" }.merge("url" => doc.url, "body" => doc.content) }
      end
      data = {
        "templates" => templates,
        "layouts" => layouts,
        "pages" => collections.fetch("pages", []),
        "site" => {
          "title" => site.config["title"],
          "data" => { "site_design" => site.data["site_design"] },
          "litters" => collections.fetch("litters", []),
          "collections" => collections.map { |label, docs| { "label" => label, "docs" => docs } }
        }
      }
      page = Jekyll::PageWithoutAFile.new(site, site.source, "admin", "preview-data.json")
      page.content = JSON.generate(data)
      page.data["layout"] = nil
      page.data["render_with_liquid"] = false
      site.pages << page
    end
  end
end
