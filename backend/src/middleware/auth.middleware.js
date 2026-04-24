import { supabase } from "../lib/supabase.js";

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.log("[Auth Middleware] No token provided");
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    console.log("[Auth Middleware] Verifying token");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.log("[Auth Middleware] Token verification error:", userError.message);
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    if (!userData?.user) {
      console.log("[Auth Middleware] No user data in token");
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = userData.user;
    console.log("[Auth Middleware] Token valid, fetching profile for:", user.id);
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.log("[Auth Middleware] Profile fetch error:", profileError.message);
      return res.status(404).json({ message: "User not found: " + profileError.message });
    }

    if (!profile) {
      console.log("[Auth Middleware] No profile found");
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      _id: user.id,
      id: user.id,
      email: user.email,
      fullName: profile.full_name || user.user_metadata?.fullName || "",
      profilePic: profile.profile_pic || "",
    };

    console.log("[Auth Middleware] User authenticated:", user.email);
    next();
  } catch (error) {
    console.log("[Auth Middleware] Unexpected error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
