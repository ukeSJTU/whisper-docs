import nextra from "nextra";

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
};

const withNextra = nextra({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
    staticImage: true,
    defaultShowCopyCode: true,
    readingTime: true,
});

export default withNextra(nextConfig);
