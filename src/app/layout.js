import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "QiHome.vn - Kỷ Nguyên Thiết Kế Nội Thất AI",
  description: "Thiết kế & Số hóa định mức hoàn thiện nội thất dành riêng cho cư dân Vinhomes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
