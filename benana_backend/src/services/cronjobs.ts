import { deleteOldFriendships } from "./friendService.js";
import { deleteOldInvitations } from "./inviteService.js";
import cron from "node-cron";

export const cronjobs = () => {
  // Cleanup old invitations every day
  cron.schedule(
    "0 3 * * *",
    async () => {
      deleteOldInvitations();
    },
    {
      timezone: "Europe/Berlin",
    },
  );

  // Cleanup old friendrequests every month
  cron.schedule(
    "0 3 1 * * *",
    async () => {
      deleteOldFriendships();
    },
    {
      timezone: "Europe/Berlin",
    },
  );
};
