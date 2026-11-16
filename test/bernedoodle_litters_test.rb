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

  def test_duplicate_addresses_fail_the_build
    litters = @site.data.fetch("bernedoodles").fetch("litters")
    litters[1]["slug"] = litters[0]["slug"]
    assert_build_error("Duplicate litter page address")
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
      html = document.output.gsub(/<script\b[^>]*>.*?<\/script>/mi, "")
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
