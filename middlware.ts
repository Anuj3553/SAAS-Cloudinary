import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    '/',
    '/home',
])

// Define public API routes
const isPublicApiRoute = createRouteMatcher([
    "/api/videos",
])

// Create a middleware function
export default clerkMiddleware((auth, req) => {
    // Get the user ID from the auth object
    const { userId } = auth();
    // Get the current URL
    const currentUrl = new URL(req.url);
    // Check if the user is accessing the dashboard
    const isAccessingDashboard = currentUrl.pathname === "/home"
    //  Check if the user is accessing an API route
    const isApiRequest = currentUrl.pathname.startsWith("/api")

    // If the user is authenticated and is trying to access a public route, redirect to the dashboard
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // If the user is not authenticated and is trying to access a private route, redirect to the sign in page
    if (!userId) {
        // If the user is trying to access a public route, allow the request
        if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url));
        }

        // If the user is trying to access a public API route, allow the request
        if (isApiRequest && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url));
        }
    }
    // Allow the request to continue
    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trcp)(.*)"],
};