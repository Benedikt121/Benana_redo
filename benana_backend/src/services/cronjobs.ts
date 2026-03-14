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
};
