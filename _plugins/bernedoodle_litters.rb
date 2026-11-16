module BernedoodleLitters
  class Generator < Jekyll::Generator
    priority :highest

    def generate(site)
      data = site.data.fetch("bernedoodles")
      page = site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
      raise "Bernedoodle page not found" unless page

      %w[title banner_heading banner_caption payment_plan_image].each do |field|
        page.data[field] = data[field]
      end
      page.content = data["body"].to_s

      collection = site.collections.fetch("litters")
      existing_urls = collection.docs.map(&:url)
      seen = {}
      Array(data["litters"]).each_with_index do |litter, index|
        slug = litter["slug"]
        unless slug.is_a?(String) && slug.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
          raise "Invalid Bernedoodle litter page address: #{slug.inspect}"
        end
        url = "/litters/#{slug}.html"
        raise "Duplicate litter page address: #{url}" if seen[slug] || existing_urls.include?(url)

        seen[slug] = true
        document = Jekyll::Document.new(
          File.join(site.source, "_litters", "#{slug}.md"),
          site: site, collection: collection
        )
        document.data.merge!(litter.reject { |key, _| key == "slug" })
        document.data.merge!("layout" => "litter", "breed" => "bernedoodles", "show_puppy_details" => true, "display_order" => index)
        document.content = ""
        collection.docs << document
      end
    end
  end
end
