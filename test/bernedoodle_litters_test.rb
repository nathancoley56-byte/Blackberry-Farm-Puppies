require "tmpdir"
require "jekyll"
require "cgi"

class BernedoodleLittersTest
  def run
    @destination = Dir.mktmpdir("bernedoodle-site")
    methods.grep(/^test_/).sort.each do |test|
      setup
      public_send(test)
      puts "PASS #{test}"
    end
  ensure
    FileUtils.remove_entry(@destination) if @destination && File.exist?(@destination)
  end

  def setup
    config = Jekyll.configuration(
      "source" => File.expand_path("..", __dir__),
      "destination" => @destination,
      "quiet" => true
    )
    @site = Jekyll::Site.new(config)
    @site.reset
    @site.read
  end

  def assert(condition, message)
    raise message unless condition
  end

  def assert_includes(content, expected)
    assert(content.include?(expected), "Expected content to include #{expected.inspect}")
  end

  def refute_includes(content, expected)
    assert(!content.include?(expected), "Expected content not to include #{expected.inspect}")
  end

  def assert_build_error(message)
    begin
      @site.generate
    rescue RuntimeError => error
      assert(error.message.include?(message), "Unexpected error: #{error.message}")
      return
    end
    raise "Expected build to fail: #{message}"
  end

  def test_multiple_changes_and_new_litter_reach_all_pages
    litters = @site.data.fetch("bernedoodles").fetch("litters")
    litters[0]["puppies"][0]["name"] = "First updated puppy"
    litters[0]["puppies"][0]["individual_details"] = "Individual-only details"
    litters[1]["puppies"][0]["name"] = "Second updated puppy"
    litters << {
      "slug" => "new-litter",
      "mother_name" => "New Mother",
      "puppies" => [{ "name" => "New puppy" }]
    }

    @site.generate
    @site.render
    docs = @site.collections.fetch("litters").docs
    breed_page = @site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
    first = docs.find { |doc| doc.url == "/litters/#{litters[0]['slug']}.html" }
    second = docs.find { |doc| doc.url == "/litters/#{litters[1]['slug']}.html" }
    added = docs.find { |doc| doc.url == "/litters/new-litter.html" }

    assert_includes breed_page.output, "First updated puppy"
    assert_includes breed_page.output, "Second updated puppy"
    assert_includes breed_page.output, "New puppy"
    refute_includes breed_page.output, "Individual-only details"
    assert_includes first.output, "First updated puppy"
    assert_includes first.output, "Individual-only details"
    assert_includes second.output, "Second updated puppy"
    assert_includes added.output, "New puppy"
    assert_includes breed_page.output, "/litters/new-litter.html"
    @site.write
    assert_includes File.read(File.join(@destination, "litters", "new-litter.html"), encoding: "UTF-8"), "New puppy"
  end

  def test_gallery_scroll_access_and_placeholders_on_both_pages
    litter = @site.data.fetch("bernedoodles").fetch("litters")[0]
    litter["puppies"] = [
      { "name" => "Many photos", "photos" => ["/one.jpg", "/two.jpg", "/three.jpg", "/four.jpg"] },
      { "name" => "Three photos", "photos" => ["/one.jpg", "/two.jpg", "/three.jpg"] },
      { "name" => "No photos" }
    ]
    @site.generate
    @site.render
    breed_page = @site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
    individual_page = @site.collections.fetch("litters").docs.find { |doc| doc.url == "/litters/#{litter['slug']}.html" }
    [breed_page, individual_page].each do |page|
      assert_includes page.output, 'aria-label="Photo gallery for Many photos, scroll for more photos" role="region" tabindex="0"'
      assert_includes page.output, 'aria-label="Photo gallery for Three photos">'
      gallery = page.output.split('aria-label="Photo gallery for No photos">', 2)[1]
      assert(gallery, "Missing empty photo gallery on #{page.url}")
      assert(gallery.split("</article>", 2)[0].scan("puppy-gallery__item--placeholder").size == 3, "Expected three placeholders on #{page.url}")
    end
  end

  def test_litter_format_is_shared_and_keeps_default_puppy_facts
    format = @site.data.fetch("litter_format")
    format.clear
    format["parent_name"] = { "font_size" => 28, "bold" => true, "alignment" => "right" }
    format["parent_role"] = { "alignment" => "left" }
    format["puppy_color"] = { "font_size_rem" => 1.125, "alignment" => "left" }
    format["puppy_price"] = { "font_size_rem" => 1.25, "alignment" => "right" }
    format["birthday"] = { "font_size" => "99; color: red" }
    format["spacing"] = {
      "parent_role" => 0, "parent_details" => 0.25, "litter_type" => 0.5,
      "ready_date" => 1.5, "estimated_weight" => 1, "birthday" => 1.25,
      "puppy_name" => 1.75, "puppy_color" => 2, "puppy_price" => 0.75
    }
    format["space_ready_date"] = 2.25
    format["parent_photos"] = { "width_rem" => 12, "gap_rem" => 2 }
    collection = @site.collections.fetch("litters")
    cavapoo = Jekyll::Document.new(File.join(@site.source, "_litters", "format-test.md"), site: @site, collection: collection)
    cavapoo.data.merge!("layout" => "litter", "breed" => "cavapoos", "name" => "Cavapoo",
                         "puppies" => [{ "name" => "Example", "color" => "Brown", "price" => "$100" }])
    collection.docs << cavapoo
    @site.generate
    @site.render
    breed = @site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
    individual = collection.docs.find { |doc| doc.url == "/litters/gracie.html" }
    [breed, individual, cavapoo].each do |page|
      assert_includes page.output, ".puppy-litter .puppy-parent__details h3 {"
      assert_includes page.output, "font-size: calc(1.75 * var(--fluid-text-unit));"
      assert_includes page.output, "font-weight: 700;"
      assert_includes page.output, "text-align: right;"
      assert_includes page.output, "justify-content: flex-start;"
      assert_includes page.output, "puppy-litter__puppy-facts--separate"
      assert_includes page.output, "font-size: calc(1.125 * var(--fluid-text-unit));"
      assert_includes page.output, "font-size: calc(1.25 * var(--fluid-text-unit));"
      assert_includes page.output, "margin-top: calc(2.25 * var(--fluid-text-unit));"
      refute_includes page.output, "margin-top: calc(1.5 * var(--fluid-text-unit));"
      assert_includes page.output, "max-width: 26.0rem; gap:"
      assert_includes page.output, "max-width: 12.0rem;"
      assert_includes page.output, "margin-top: calc(0.75 * var(--fluid-text-unit));"
      assert_includes page.output, "margin-top: calc(0.0 * var(--fluid-text-unit));"
      assert_includes page.output, ".puppy-litter .puppy-parent__description { margin-top: calc(0.25 * var(--fluid-text-unit)); }"
      assert_includes page.output, ".puppy-litter .puppy-details { margin-top: calc(0.5 * var(--fluid-text-unit)); }"
      assert_includes page.output, ".puppy-litter .puppy-details__weight { margin-top: calc(1.0 * var(--fluid-text-unit)); }"
      assert_includes page.output, ".puppy-litter .puppy-details__birthday { margin-top: calc(1.25 * var(--fluid-text-unit)); }"
      assert_includes page.output, ".puppy-litter .puppy-litter__puppy-details h3 { margin-top: calc(1.75 * var(--fluid-text-unit)); }"
      assert_includes page.output, ".puppy-litter .puppy-litter__puppy-facts { margin-top: calc(2.0 * var(--fluid-text-unit)); }"
      refute_includes page.output, "99; color: red"
    end
    preview = @site.pages.find { |page| page.url == "/admin/preview-data.json" }
    assert_includes preview.content, '"litter_format"'

    format["puppy_color"] = {}
    format["puppy_price"] = {}
    format["spacing"] = {}
    @site.render
    refute_includes breed.output, "puppy-litter__puppy-facts--separate"
  end

  def test_duplicate_addresses_fail_the_build
    litters = @site.data.fetch("bernedoodles").fetch("litters")
    litters[1]["slug"] = litters[0]["slug"]
    assert_build_error("Duplicate litter page address")
  end

  def test_negative_spacing_is_rendered_and_out_of_range_is_ignored
    format = @site.data.fetch("litter_format")
    keys = %w[parent_role parent_details litter_type ready_date estimated_weight birthday puppy_name puppy_color puppy_price]
    keys.each { |key| format["space_#{key}"] = -0.5 }
    @site.generate
    @site.render
    page = @site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
    assert(page.output.scan("margin-top: calc(-0.5 * var(--fluid-text-unit));").length == keys.length, "Negative spacing missing from some text pairs")
    assert_includes page.output, "puppy-litter__puppy-facts--separate"
    format["space_ready_date"] = -5
    format["space_birthday"] = -5.125
    @site.render
    assert_includes page.output, "margin-top: calc(-5.0 * var(--fluid-text-unit));"
    refute_includes page.output, "margin-top: calc(-5.125 * var(--fluid-text-unit));"
  end

  def test_site_typography_uses_shared_fluid_scale
    css = File.read(File.join(@site.source, "style.css"), encoding: "UTF-8")
    assert_includes css, "--fluid-text-unit: clamp(0.8rem, calc(0.733333rem + 0.333333vw), 1rem);"
    sizes = css.scan(/font-size:\s*([^;]+);/).flatten
    assert(sizes.all? { |size| size.include?("var(--fluid-text-unit)") }, "Found a font size outside the shared fluid scale")
    assert_includes css, "font-size: calc(1.85 * var(--fluid-text-unit));"
    assert_includes css, "font-size: calc(2.5 * var(--fluid-text-unit));"
  end

  def test_invalid_addresses_fail_the_build
    @site.data.fetch("bernedoodles").fetch("litters")[0]["slug"] = "../invalid"
    assert_build_error("Invalid Bernedoodle litter page address")
  end

  def test_removed_litter_has_no_generated_page
    litters = @site.data.fetch("bernedoodles").fetch("litters")
    removed = litters.shift
    @site.generate
    assert(!@site.collections.fetch("litters").docs.any? { |doc| doc.url == "/litters/#{removed['slug']}.html" }, "Removed litter still generated")
  end

  def test_existing_cavapoo_address_is_not_overwritten
    collection = @site.collections.fetch("litters")
    document = Jekyll::Document.new(
      File.join(@site.source, "_litters", "occupied.md"),
      site: @site, collection: collection
    )
    document.data["breed"] = "cavapoos"
    document.content = ""
    collection.docs << document
    @site.data.fetch("bernedoodles").fetch("litters")[0]["slug"] = "occupied"
    assert_build_error("Duplicate litter page address")
  end

  def test_customer_text_uses_puppies_not_litter
    @site.data.fetch("bernedoodles").fetch("litters") << {
      "slug" => "unnamed",
      "mother_name" => "Example"
    }
    @site.generate
    @site.render
    documents = @site.collections.fetch("pages").docs + @site.collections.fetch("litters").docs
    documents.each do |document|
      html = document.output.gsub(/<(script|style)\b[^>]*>.*?<\/\1>/mi, "")
      accessibility = html.scan(/\b(?:aria-label|alt|title)\s*=\s*["']([^"']*)["']/i).flatten.join(" ")
      text = CGI.unescapeHTML(html.gsub(/<[^>]+>/m, " ") + " " + accessibility)
      assert(!text.match?(/\blitter(?:s|mates)?\b/i), "Customer-facing litter wording in #{document.url}")
    end
  end

  def test_list_order_controls_breed_page_and_navigation
    litters = @site.data.fetch("bernedoodles").fetch("litters")
    litters.reverse!
    6.times do |index|
      litters << { "slug" => "extra-#{index}", "mother_name" => "Extra #{index}" }
    end
    expected_names = litters.map { |litter| litter.fetch("mother_name") }
    @site.generate
    @site.render
    pages = @site.collections.fetch("pages").docs
    breed = pages.find { |page| page.url == "/bernedoodles.html" }
    home = pages.find { |page| page.url == "/" }
    [breed, home].each do |page|
      nav = page.output.split('<summary class="nav-dropdown__summary">Bernedoodles', 2).last.split("</ul>", 2).first
      names = nav.scan(%r{<a href="/litters/[^"]+"[^>]*>(.*?)'s puppies</a>}).flatten
      assert(names == expected_names, "Bernedoodle navigation order mismatch on #{page.url}: #{names.inspect}")
    end
    names = breed.output.scan(/<article class="puppy-parent">.*?<h3>(.*?)<\/h3>/m).flatten.each_slice(2).map(&:first)
    assert(names == expected_names, "Bernedoodle page order mismatch: #{names.inspect}")
  end

  def test_seasonal_design_is_optional_and_used_on_all_page_layouts
    @site.data.fetch("site_design")["seasonal_image"] = "/images/seasonal design.png"
    @site.generate
    @site.render
    documents = @site.collections.fetch("pages").docs + @site.collections.fetch("litters").docs
    %w[/ /bernedoodles.html /litters/gracie.html].each do |url|
      page = documents.find { |doc| doc.url == url }
      assert_includes page.output, '--seasonal-banner-image: url("/images/seasonal%20design.png")'
    end
  end

  def test_no_seasonal_design_leaves_brand_color_as_fallback
    @site.data.fetch("site_design")["seasonal_image"] = ""
    @site.generate
    @site.render
    page = @site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
    refute_includes page.output, "--seasonal-banner-image:"
    assert_includes page.output, "--brand-color:"
  end

  def test_mobile_navigation_resets_current_breed_dropdown
    @site.generate
    @site.render
    page = @site.collections.fetch("pages").docs.find { |doc| doc.url == "/bernedoodles.html" }
    assert_includes page.output, 'details open data-current-section="true"'
    assert_includes page.output, 'section.open = !mobile.matches'
  end
end

BernedoodleLittersTest.new.run
