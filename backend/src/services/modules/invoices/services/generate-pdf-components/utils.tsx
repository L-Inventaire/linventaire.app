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

const renderNodes = (nodes, style = {}, parentIsText = false) => {
  return nodes.map((node, i) => {
    if (node.type === "text") {
      return (
        <Text key={i} style={style}>
          {node.data}
        </Text>
      );
    } else if (node.type === "tag") {
      const children = renderNodes(
        node.children || [],
        style,
        node.name === "text"
      );

      const content = (() => {
        switch (node.name) {
          case "br":
            return <Text key={i}>{"\n"}</Text>;
          case "b":
          case "strong":
            return (
              <Text key={i} style={{ ...style, fontWeight: "bold" }}>
                {children}
              </Text>
            );
          case "i":
          case "em":
            return (
              <Text key={i} style={{ ...style, fontStyle: "italic" }}>
                {children}
              </Text>
            );
          case "p":
            return parentIsText ? (
              <Text key={i}>
                {children}
                {"\n"}
              </Text>
            ) : (
              <View key={i}>
                <Text>{children}</Text>
              </View>
            );
          case "ul":
          case "ol":
            return parentIsText ? (
              <Text key={i}>{children}</Text>
            ) : (
              <View key={i} style={{ paddingLeft: 10 }}>
                {children}
              </View>
            );
          case "li":
            return (
              <Text key={i}>
                • {children}
                {"\n"}
              </Text>
            );
          case "blockquote":
            return parentIsText ? (
              <Text key={i}>{children}</Text>
            ) : (
              <View
                key={i}
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
            return <Text key={i}>{children}</Text>;
        }
      })();

      return content;
    }

    return null;
  });
};

export const convertHtml = (html: string, style: any = {}) => {
  const dom = parseDocument(html);
  return renderNodes(dom.children, style);
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
  timeZone: string | "Europe/Paris"
) => {
  try {
    // Only case were we don't need to convert the date (it was stored as string)
    if (typeof date === "string") {
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
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

    return new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];
  } catch (e) {
    return null;
  }
};
