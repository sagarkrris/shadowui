# Regenerate the checked-in daily practice HTML after editing its Markdown.
# Uses the same Redcarpet dependency as render-senior-java-guide.rb.
require "redcarpet"
require "fileutils"
require "cgi"

root = File.expand_path("..", __dir__)
source_dir = File.join(root, "content/senior-java/daily")
output_dir = File.join(source_dir, "rendered")
FileUtils.mkdir_p(output_dir)

class DailyPracticeRenderer < Redcarpet::Render::HTML
  def header(text, level)
    base = CGI.unescapeHTML(text.gsub(/<[^>]*>/, "")).downcase.gsub(/[^\p{Alnum}]+/u, "-").sub(/\A-/, "").sub(/-\z/, "")
    @heading_counts ||= Hash.new(0)
    count = @heading_counts[base]
    @heading_counts[base] += 1
    slug = count.zero? ? base : "#{base}-#{count}"
    "<h#{[level + 1, 6].min} id=\"#{CGI.escapeHTML(slug)}\">#{text}</h#{[level + 1, 6].min}>\n"
  end
end

Dir.glob(File.join(source_dir, "set-*.md")).sort.each do |file|
  markdown = File.read(file)
  questions = markdown.scan(/^\*\*(\d+)\. (.+?)\*\*$/)
  abort "Expected 12 numbered questions in #{file}" unless questions.map { |number, _| number.to_i } == (1..12).to_a
  markdown = markdown.gsub(/^\*\*(\d+)\. (.+?)\*\*$/, '## \1. \2')
  renderer = DailyPracticeRenderer.new(filter_html: true, safe_links_only: true, no_images: true)
  html = Redcarpet::Markdown.new(renderer, fenced_code_blocks: true, tables: true, autolink: true).render(markdown)
  File.write(File.join(output_dir, "#{File.basename(file, '.md')}.html"), html)
end
