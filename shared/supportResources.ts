import type { RiskCategory } from "./safeguarding";

/**
 * Human support and emergency signposting, by manually selected country.
 *
 * Only add a country once each number has been checked against the
 * organisation's own website. Unknown countries get generic guidance rather
 * than guessed numbers.
 */
export interface SupportResource {
  name: string;
  description: string;
  /** Display value, e.g. "116 123". */
  contact: string;
  /** tel:, sms:, mailto: or https: link. */
  href: string;
  /** Show only for these risk categories. Omit to show always. */
  onlyFor?: RiskCategory[];
}

export interface CountrySupport {
  code: string;
  name: string;
  emergency: { number: string; href: string; text: string };
  resources: SupportResource[];
  /** When the resources were last checked against official sources. */
  verified: string;
}

export const SUPPORT_BY_COUNTRY: Record<string, CountrySupport> = {
  GB: {
    code: "GB",
    name: "United Kingdom",
    emergency: {
      number: "999",
      href: "tel:999",
      text: "If you or someone else is in immediate danger, call 999 (or 112).",
    },
    resources: [
      {
        name: "NHS 111",
        description: "Urgent mental health help, day or night. In England and Wales, choose the mental health option.",
        contact: "111",
        href: "tel:111",
      },
      {
        name: "Samaritans",
        description: "Free, confidential emotional support, 24 hours a day. You don't have to be suicidal to call.",
        contact: "116 123",
        href: "tel:116123",
      },
      {
        name: "National Domestic Abuse Helpline",
        description: "Free, confidential support for anyone experiencing domestic abuse, 24 hours a day.",
        contact: "0808 2000 247",
        href: "tel:08082000247",
        onlyFor: ["unsafe"],
      },
    ],
    verified: "2026-11",
  },
};

export const OTHER_COUNTRY: CountrySupport = {
  code: "OTHER",
  name: "Another country",
  emergency: {
    number: "",
    href: "",
    text: "If you or someone else is in immediate danger, contact your local emergency number now.",
  },
  resources: [
    {
      name: "Find A Helpline",
      description: "A directory of free, confidential helplines in many countries.",
      contact: "findahelpline.com",
      href: "https://findahelpline.com",
    },
  ],
  verified: "2026-11",
};

export const COUNTRY_OPTIONS = [...Object.values(SUPPORT_BY_COUNTRY), OTHER_COUNTRY].map((c) => ({ code: c.code, name: c.name }));

export function supportFor(country: string | undefined): CountrySupport {
  return (country && SUPPORT_BY_COUNTRY[country]) || (country === "OTHER" ? OTHER_COUNTRY : SUPPORT_BY_COUNTRY.GB);
}
