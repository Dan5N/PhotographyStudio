import { cookies } from "next/headers";

import { TRPCReactProvider } from "@/trpc/react";
import TranslationsProvider from "../providers/translations-provider";
import initTranslations from "../i18n";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "@/components/ui/toaster";
const i18nNamespaces = ["common", "menu", "dashboard"];

export const metadata = {
  title: "Ray Admin",
  description: "Welcome Ray Admin",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout(props: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    children
  } = props;

  const { resources } = await initTranslations(
    params.locale,
    i18nNamespaces,
  );
  return (
    (<TRPCReactProvider cookies={(await cookies()).toString()}>
      <TranslationsProvider
        namespaces={i18nNamespaces}
        locale={params.locale}
        resources={resources}
      >
        <Toaster />
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </TranslationsProvider>
    </TRPCReactProvider>)
  );
}
