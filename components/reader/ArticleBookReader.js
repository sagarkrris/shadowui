import { useEffect, useState } from "react";
import BookReader from "./BookReader";

/** Enhance the existing article DOM so interactive lessons keep their state. */
export default function ArticleBookReader({ path, contentsHref }) {
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const target = document.querySelector("main");
    const heading = target?.querySelector("h1");
    if (heading) setArticle({ target, title: heading.textContent.trim() });
  }, [path]);

  if (!article) return null;
  return <BookReader target={article.target} storageId={path} title={article.title} contentsHref={contentsHref} />;
}
