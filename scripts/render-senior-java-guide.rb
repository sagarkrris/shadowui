# Regenerate the checked-in HTML fragments after editing the source guide.
# Requires the Redcarpet gem; the site serves the generated files and does not
# need Ruby or Redcarpet at build time.
require "redcarpet"
require "fileutils"
require "cgi"

root = File.expand_path("..", __dir__)
source = File.read(File.join(root, "content/senior-java/Senior-Java-Interview-Master-Guide-Corrected.md"))
markers = source.to_enum(:scan, /^<!-- ===== Part [1-8]:.*?===== -->$|^# Part (?:9|10|11|12|13|14|15|16) .+$/).map { Regexp.last_match.begin(0) }
abort "Expected 16 guide parts, found #{markers.length}" unless markers.length == 16
refresher_split = source.index("\n## Module 5: Maven")
abort "Refresher split point is missing" unless refresher_split && refresher_split.between?(markers[0], markers[1])
boundaries = [markers[0], refresher_split + 1, *markers[1..]]
slugs = ["part-1a", "part-1b", *(2..16).map { |number| "part-#{number}" }]

class GuideRenderer < Redcarpet::Render::HTML
  def header(text, level)
    depth = [level + 1, 6].min
    base = CGI.unescapeHTML(text.gsub(/<[^>]*>/, "")).downcase.gsub(/[^\p{Alnum}]+/u, "-").sub(/\A-/, "").sub(/-\z/, "")
    @heading_counts ||= Hash.new(0)
    count = @heading_counts[base]
    @heading_counts[base] += 1
    slug = count.zero? ? base : "#{base}-#{count}"
    "<h#{depth} id=\"#{CGI.escapeHTML(slug)}\">#{text}</h#{depth}>\n"
  end
end

output = File.join(root, "content/senior-java/rendered")
FileUtils.mkdir_p(output)
FileUtils.rm_f(File.join(output, "part-1.html"))
introduction = source[0...source.index("\n## Contents")].sub(/\A# [^\n]+\n+/, "")
intro_renderer = GuideRenderer.new(filter_html: true, safe_links_only: true, no_images: true)
File.write(File.join(output, "introduction.html"), Redcarpet::Markdown.new(intro_renderer, fenced_code_blocks: true, tables: true).render(introduction))

pages = {}
boundaries.each_with_index do |start, index|
  text = source[start...(boundaries[index + 1] || source.length)].sub(/\A<!--[^\n]*-->\s*/, "")
  renderer = GuideRenderer.new(filter_html: true, safe_links_only: true, no_images: true)
  markdown = Redcarpet::Markdown.new(renderer, fenced_code_blocks: true, tables: true, autolink: true, strikethrough: true)
  pages[slugs[index]] = markdown.render(text)
end

# Supplemental chapters retain their question numbering from the master export.
supplement = File.read(File.join(root, "content/senior-java/part-21.md"))
renderer = GuideRenderer.new(filter_html: true, safe_links_only: true, no_images: true)
pages["part-21"] = Redcarpet::Markdown.new(renderer, fenced_code_blocks: true, tables: true, autolink: true, strikethrough: true).render(supplement)

anchor_aliases = {
  "2-number-of-islands-dfs-orows--cols" => "2-number-of-islands-dfs-o-rows-cols",
  "3-build-order-with-cycle-detection-kahns-topological-sort" => "3-build-order-with-cycle-detection-kahn-s-topological-sort",
  "3-coin-change-fewest-coins-dp-oamount--coins" => "3-coin-change-fewest-coins-dp-o-amount-coins",
  "3-top-k-frequent-elements-min-heap-on-log-k" => "3-top-k-frequent-elements-min-heap-o-n-log-k",
  "4-merge-overlapping-intervals-on-log-n" => "4-merge-overlapping-intervals-o-n-log-n",
  "4-search-in-a-rotated-sorted-array-olog-n" => "4-search-in-a-rotated-sorted-array-o-log-n"
}
ids = pages.transform_values { |html| html.scan(/id="([^"]+)"/).flatten }
pages.each do |slug, html|
  html = html.gsub(/href="#([^"]+)"/) do
    target = Regexp.last_match(1)
    next Regexp.last_match(0) if ids[slug].include?(target)
    resolved = anchor_aliases.fetch(target, target)
    owners = ids.select { |_, page_ids| page_ids.include?(resolved) }.keys
    abort "Unresolved or ambiguous guide link: #{target}" unless owners.length == 1
    "href=\"/senior-java-interview/#{owners.first}##{resolved}\""
  end
  File.write(File.join(output, "#{slug}.html"), html)
end
