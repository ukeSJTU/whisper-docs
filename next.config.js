import nextra from "nextra";

const isProduction = process.env.NODE_ENV === "production";
const assetPrefix = isProduction ? "/whisper-docs" : "";

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    output: "export",
    images: {
        unoptimized: true,
    },
    reactStrictMode: true,
    swcMinify: true,
    trailingSlash: true,
    assetPrefix,
    basePath: assetPrefix,
};

const withNextra = nextra({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
    staticImage: true,
    defaultShowCopyCode: true,
    readingTime: true,
});

export default withNextra(nextConfig);
