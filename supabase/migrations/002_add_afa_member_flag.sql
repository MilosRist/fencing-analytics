-- Add isAfaMember flag to Member table
-- Members imported from the ftest Membership sheet are AFA members.
-- Run: npx prisma migrate dev --name add-afa-member-flag
-- Or for existing DB: npx prisma db push

ALTER TABLE "Member" ADD "isAfaMember" BOOLEAN NOT NULL DEFAULT false;