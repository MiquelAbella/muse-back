const Playlist = require("../models/Playlist");
const User = require("../models/User");

const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPrivate: false });
    console.log(playlists);
    return res.status(200).json({
      ok: true,
      playlists,
    });
  } catch (error) {
    console.log(error);
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};

const followPlaylists = async (req, res) => {
  const { loggedUserId, playlistId, isAdded } = req.body;
  try {
    const loggedUser = await User.findOne({ _id: loggedUserId });
    if (isAdded) {
      await loggedUser.updateOne({
        $addToSet: { playlists: { $each: playlistId } },
      });
      return res.status(200).json({
        ok: true,
        loggedUserId,
        playlistId,
        isAdded,
      });
    } else {
      await loggedUser.updateOne({ $pull: { playlists: { $in: playlistId } } });
      return res.status(200).json({
        ok: true,
        loggedUserId,
        playlistId,
        isAdded,
      });
    }
  } catch (error) {
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};

const createPlaylist = async (req, res) => {
  const {
    playlist: { name, img, isPrivate },
    userId,
  } = req.body;

  console.log(name, img, isPrivate, userId);

  try {
    const loggedUser = await User.findOne({ _id: userId });
    const newPlaylist = new Playlist({
      name,
      user: userId,
      thumbnail: img,
      isPrivate,
    });
    await newPlaylist.save();
    await loggedUser.updateOne({ $push: { playlists: newPlaylist._id } });
    return res.status(201).json({
      ok: true,
      newPlaylist,
    });
  } catch (error) {
    console.log(error);
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};

const deletePlaylist = async (req, res) => {
  const { loggedUserId, playlistId } = req.body;

  try {
    const loggedUser = await User.findOne({ _id: loggedUserId });
    const playlistToDelete = await Playlist.findOne({ _id: playlistId });
    if (playlistToDelete.user.toString() !== loggedUserId) {
      return res.status(401).json({
        ok: false,
        message: "You are not the owner of this playlist",
      });
    }
    await loggedUser.updateOne({ $pull: { playlists: playlistId } });
    await Playlist.findByIdAndDelete(playlistId).then((deletedPlaylist) => {
      return res.status(200).json({
        ok: true,
        deletedPlaylist,
      });
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};

const updatePlaylist = async (req, res) => {
  const { loggedUserId, playlistId, newName, thumbnailUrl } = req.body;
  try {
    const playlistToUpdate = await Playlist.findOne({ _id: playlistId });
    if (playlistToUpdate.user.toString() !== loggedUserId) {
      return res.status(401).json({
        ok: false,
        message: "You are not the owner of this playlist",
      });
    }
    const oldName = playlistToUpdate.name;
    await playlistToUpdate.updateOne({ name: newName });
    await playlistToUpdate.updateOne({ thumbnail: thumbnailUrl });
    return res.status(200).json({
      ok: true,
      playlistToUpdate,
      oldName,
      newName,
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};

const getPlaylistById = async (req, res) => {
  const { id } = req.params;

  if (id.length !== 24) {
    return res.status(200).json({
      ok: false,
    });
  }

  try {
    const playlist = await Playlist.findOne({ _id: id }).populate("tracks");

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        msg: "No playlists with this id",
      });
    }

    return res.status(200).json({
      ok: true,
      playlist,
    });
  } catch (error) {
    console.log(error);
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};
const isPrivate = async (req, res) => {
  const { loggedUserId, playlistId, isPrivate } = req.body;

  try {
    const playlistToUpdate = await Playlist.findOne({ _id: playlistId });
    if (playlistToUpdate.user.toString() !== loggedUserId) {
      return res.status(401).json({
        ok: false,
        message: "You are not the owner of this playlist",
      });
    }
    await playlistToUpdate.updateOne({ isPrivate: !isPrivate });
    return res.status(200).json({
      ok: true,
      playlistToUpdate,
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      msg: "Oops, something happened",
    });
  }
};
module.exports = {
  getPlaylists,
  getPlaylistById,
  followPlaylists,
  updatePlaylist,
  deletePlaylist,
  createPlaylist,
  isPrivate,
};
