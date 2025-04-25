import { Router } from "express";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });
};
