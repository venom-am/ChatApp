import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { supabase } from "../lib/supabase.js";

const formatProfile = (profile) => ({
  _id: profile.id,
  fullName: profile.full_name,
  email: profile.email,
  profilePic: profile.profile_pic,
});

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", loggedInUserId);

    if (error) {
      console.error("Error in getUsersForSidebar: ", error.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.status(200).json(profiles.map(formatProfile));
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const filter = `or(and(sender_id.eq.${myId},receiver_id.eq.${userToChatId}),and(sender_id.eq.${userToChatId},receiver_id.eq.${myId}))`;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Error in getMessages controller: ", error.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    const messages = data.map((message) => ({
      ...message,
      _id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
    }));

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          text,
          image: imageUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("Error in sendMessage controller: ", error.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    const newMessage = {
      _id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      text: data.text,
      image: data.image,
      createdAt: data.created_at,
    };

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
