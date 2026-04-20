export const routes = [
    {
        path: "/",
        title: "FleetOps Hub | Home",
        view: {
            html: "/src/views/home/view.html",
            css: "/src/views/home/view.css",
            js: "/src/views/home/view.js",
        },
    },
    {
        path: "/page-one",
        title: "FleetOps Hub | Page One",
        view: {
            html: "/src/views/page-one/view.html",
            css: "/src/views/page-one/view.css",
            js: "/src/views/page-one/view.js",
        },
    },
    {
        path: "/preview-page",
        title: "FleetOps Hub | Template Page",
        view: {
            html: "/src/views/preview-page/view.html",
            css: "/src/views/preview-page/view.css",
            js: "/src/views/preview-page/view.js",
        },
    },
    {
        path: "/users",
        title: "FleetOps Hub | User Management",
        view: {
            html: "/src/views/users/view.html",
            css: "/src/views/users/view.css",
            js: "/src/views/users/view.js",
        },
    },
    {
        path: "/audit",
        title: "FleetOps Hub | Audit Log",
        view: {
            html: "/src/views/audit/view.html",
            css: "/src/views/audit/view.css",
            js: "/src/views/audit/view.js",
        },
    },
    {
        path: "/settings",
        title: "FleetOps Hub | Settings",
        view: {
            html: "/src/views/settings/view.html",
            css: "/src/views/settings/view.css",
            js: "/src/views/settings/view.js",
        },
    },
];

export const notFoundRoute = {
    path: "/404",
    title: "FleetOps Hub | Not Found",
    view: {
        html: "/src/views/not-found/view.html",
        css: "/src/views/not-found/view.css",
        js: "/src/views/not-found/view.js",
    },
};

export function normalizePath(pathname) {
    if (!pathname || pathname === "/index.html") {
        return "/";
    }

    const trimmed =
        pathname.endsWith("/") && pathname.length > 1
            ? pathname.slice(0, -1)
            : pathname;

    return trimmed;
}
