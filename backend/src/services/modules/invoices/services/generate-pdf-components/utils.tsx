import { Text, View } from "@react-pdf/renderer";
import { parseDocument } from "htmlparser2";
import React from "react";

export const KeyValueDisplay = (props: {
  secondaryColor?: string;
  style?: any;
  list: { label: any; value: any }[];
  vertical?: boolean;
}) => (
  <View style={{ width: "100%", ...(props.style || {}) }}>
    {props.list.filter(Boolean).map((item, index) => (
      <View
        key={index}
        style={{
          flexDirection: props.vertical ? undefined : "row",
          marginBottom: props.vertical ? 8 : 4,
        }}
      >
        <Text
          style={{
            color: props.secondaryColor,
            fontWeight: "bold",
            flexGrow: 1,
            marginBottom: props.vertical ? 2 : 0,
          }}
        >
          {item.label}
        </Text>
        {typeof item.value === "string" ? (
          <Text>{item.value}</Text>
        ) : (
          item.value
        )}
      </View>
    ))}
  </View>
);

export const formatIBAN = (iban: string) => {
  return (
    iban &&
    iban
      .toLocaleUpperCase()
      .replace(/[^A-Z0-9]/gm, "")
      .replace(/([A-Z0-9]{4})/g, "$1 ")
      .replace(/ $/gm, "")
  );
};

export const formatAmount = (number: number, currency = "EUR") => {
  return (parseFloat(number as any) || 0)
    .toLocaleString("fr-FR", {
      style: "currency",
      currency,
    })
    .replace(/(\u{202F})/gu, () => "\u00A0");
};

export const formatNumber = (number: number) => {
  return (number || 0)
    .toLocaleString("fr-FR")
    .replace(/(\u{202F})/gu, () => "\u00A0");
};

const renderNodes = (nodes, style = {}, parentIsText = false, depth = 0) => {
  // Prevent infinite recursion - max depth of 20 levels
  if (depth > 20) {
    console.warn("HTML rendering depth exceeded, truncating");
    return null;
  }

  // Handle null/undefined nodes
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return null;
  }

  // Limit number of nodes to prevent memory issues
  const limitedNodes = nodes.slice(0, 1000);
  if (nodes.length > 1000) {
    console.warn(
      "Too many HTML nodes, truncating from",
      nodes.length,
      "to 1000"
    );
  }

  return limitedNodes
    .filter((node) => node)
    .map((node, i) => {
      // Skip undefined/null nodes
      if (!node || !node.type) {
        return null;
      }

      if (node.type === "text") {
        // Skip empty text nodes
        if (!node.data || node.data.trim() === "") {
          return null;
        }
        return (
          <Text key={`text-${depth}-${i}`} style={style}>
            {node.data}
          </Text>
        );
      } else if (node.type === "tag") {
        const children = renderNodes(
          node.children || [],
          style,
          node.name === "text",
          depth + 1
        );

        const uniqueKey = `${node.name}-${depth}-${i}`;
        const content = (() => {
          switch (node.name) {
            case "br":
              return <Text key={uniqueKey}>{"\n"}</Text>;
            case "b":
            case "strong":
              return (
                <Text key={uniqueKey} style={{ ...style, fontWeight: "bold" }}>
                  {children}
                </Text>
              );
            case "i":
            case "em":
              return (
                <Text key={uniqueKey} style={{ ...style, fontStyle: "italic" }}>
                  {children}
                </Text>
              );
            case "p":
              return parentIsText ? (
                <Text key={uniqueKey}>
                  {children}
                  {"\n"}
                </Text>
              ) : (
                <View key={uniqueKey}>
                  <Text>{children}</Text>
                </View>
              );
            case "ul":
            case "ol":
              return parentIsText ? (
                <Text key={uniqueKey}>{children}</Text>
              ) : (
                <View key={uniqueKey} style={{ paddingLeft: 10 }}>
                  {children}
                </View>
              );
            case "li":
              return (
                <Text key={uniqueKey}>
                  • {children}
                  {"\n"}
                </Text>
              );
            case "blockquote":
              return parentIsText ? (
                <Text key={uniqueKey}>{children}</Text>
              ) : (
                <View
                  key={uniqueKey}
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: "#ccc",
                    paddingLeft: 5,
                  }}
                >
                  {children}
                </View>
              );
            default:
              return <Text key={uniqueKey}>{children}</Text>;
          }
        })();

        return content;
      }

      return null;
    });
};

export const convertHtml = (html: string, style: any = {}) => {
  if (!html || typeof html !== "string") {
    return null;
  }

  // Truncate very long HTML to prevent parsing issues
  const maxLength = 50000; // ~50KB
  if (html.length > maxLength) {
    console.warn(
      "HTML content too long, truncating from",
      html.length,
      "to",
      maxLength
    );
    html = html.substring(0, maxLength) + "...";
  }

  // Skip empty or whitespace-only HTML
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  if (
    stripped === "" ||
    html.trim() === "<p><br></p>" ||
    html.trim() === "<br>" ||
    html.trim() === "<p></p>"
  ) {
    return null;
  }

  try {
    const dom = parseDocument(html);
    if (!dom || !dom.children) {
      return null;
    }
    const result = renderNodes(dom.children, style);
    // Filter out null/undefined results
    if (!result || !Array.isArray(result)) {
      return null;
    }
    const filtered = result.filter(Boolean);
    return filtered.length > 0 ? filtered : null;
  } catch (e) {
    console.error("Failed to parse HTML:", e, "HTML:", html.substring(0, 200));
    // Fallback to plain text
    const plainText = convertHtmlText(html);
    if (plainText && plainText.trim()) {
      return <Text style={style}>{plainText}</Text>;
    }
    return null;
  }
};

export const convertHtmlText = (html: string) => {
  // Remove HTML tags
  return (html || "").replace(/<[^>]*>?/gm, " ").replace(/ +/gm, " ");
};

/*
Display the date but like if we're in the specified timezone
*/
export const displayDate = (
  date: Date | number | string,
  timeZone: string | "Europe/Paris",
  language = "fr"
) => {
  try {
    // Only case were we don't need to convert the date (it was stored as string)
    if (typeof date === "string") {
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const year = date.split("-")[0];
        const month = date.split("-")[1];
        const day = date.split("-")[2];
        return formatDate(language, year, month, day);
      }
    }

    // Timezone offset
    const parts = new Intl.DateTimeFormat("en-US", { timeZone }).formatToParts(
      new Date(date)
    );
    const year = parseInt(parts.find((part) => part.type === "year").value);
    const month =
      parseInt(parts.find((part) => part.type === "month").value) - 1; // JS months are 0-indexed
    const day = parseInt(parts.find((part) => part.type === "day").value);

    return formatDate(language, year + "", month + 1 + "", day + "");
  } catch (e) {
    return null;
  }
};

function formatDate(
  language: string,
  year: string,
  month: string,
  day: string
) {
  if (language.toLocaleLowerCase().includes("fr")) {
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
