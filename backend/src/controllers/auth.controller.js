import cloudinary from "../lib/cloudinary.js";
import { supabase } from "../lib/supabase.js";

const formatUser = (user, profile) => ({
  _id: user.id,
  fullName: profile?.full_name || user.user_metadata?.fullName || "",
  email: user.email,
  profilePic: profile?.profile_pic || "",
});

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    console.log("[Signup] Attempting signup for email:", email);
    
    if (!fullName || !email || !password) {
      console.log("[Signup] Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      console.log("[Signup] Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    console.log("[Signup] Creating user in Supabase auth");
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { fullName },
    });

    if (createError) {
      console.log("[Signup] Auth creation error:", createError.code, "-", createError.message);
      return res.status(400).json({ message: createError.message });
    }

    if (!createData?.user?.id) {
      console.log("[Signup] No user ID returned from auth");
      return res.status(400).json({ message: "Failed to create user" });
    }

    const user = createData.user;
    console.log("[Signup] Creating profile for user:", user.id);

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        full_name: fullName,
        email,
        profile_pic: "",
      },
    ]);

    if (profileError) {
      console.log("[Signup] Profile creation error:", profileError.code, "-", profileError.message);
      return res.status(500).json({ message: "Profile creation failed: " + profileError.message });
    }

    console.log("[Signup] Profile created, signing in user");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      console.log("[Signup] Login after signup error:", loginError.message);
      return res.status(400).json({ message: loginError.message });
    }

    console.log("[Signup] Signup successful for:", email);
    const responseUser = formatUser(user, {
      full_name: fullName,
      profile_pic: "",
    });

    res.status(201).json({ user: responseUser, accessToken: loginData.session?.access_token });
  } catch (error) {
    console.log("[Signup] Unexpected error:", error.message);
    console.log("[Signup] Stack:", error.stack);
    res.status(500).json({ message: "Internal Server Error: " + error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("[Login] Attempting login for email:", email);
    
    if (!email || !password) {
      console.log("[Login] Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      console.log("[Login] Auth error:", loginError.code, "-", loginError.message);
      return res.status(400).json({ message: loginError.message || "Invalid credentials" });
    }

    if (!loginData?.user) {
      console.log("[Login] No user returned from auth");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("[Login] Auth successful, fetching profile for user:", loginData.user.id);
    
    const user = loginData.user;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.log("[Login] Profile fetch error:", profileError.code, "-", profileError.message);
      return res.status(500).json({ message: "Profile not found: " + profileError.message });
    }

    if (!profile) {
      console.log("[Login] Profile not found for user");
      return res.status(500).json({ message: "Profile not found" });
    }

    console.log("[Login] Login successful for:", email);
    const responseUser = formatUser(user, profile);

    res.status(200).json({ user: responseUser, accessToken: loginData.session?.access_token });
  } catch (error) {
    console.log("[Login] Unexpected error:", error.message);
    console.log("[Login] Stack:", error.stack);
    res.status(500).json({ message: "Internal Server Error: " + error.message });
  }
};

export const logout = (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const { data: updatedProfile, error: profileError } = await supabase
      .from("profiles")
      .update({ profile_pic: uploadResponse.secure_url })
      .eq("id", userId)
      .select("*")
      .single();

    if (profileError) {
      return res.status(500).json({ message: profileError.message });
    }

    res.status(200).json(formatUser(req.user, updatedProfile));
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
