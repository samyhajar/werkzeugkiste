Goal
 - Show the student’s full name on certificates (not the email).
 - Store proper names in `public.profiles.full_name` during signup.

What changed in the app
 - Signup API now stores `full_name` and `first_name` in `profiles` and also in auth `user_metadata`.
 - Signup modal collects first and last name separately; API composes `full_name`.
 - Certificate generator writes the student’s display name (prefers profile `full_name`, falls back to auth metadata, and only then email if necessary).
 - Admin certificate regeneration API falls back to auth metadata when `profiles.full_name` is an email.

Database changes to apply in Supabase
Run the SQL in `sql/fix_full_names.sql` in the Supabase SQL Editor (or as a migration) to:
 1) Update the `handle_new_user` trigger so it never writes the email into `profiles.full_name` when no name is provided.
 2) Backfill existing profiles where `full_name` contains an email, using data from `auth.users.raw_user_meta_data` when possible.

After running the SQL
 - New signups will have correct `full_name`.
 - Existing rows with an actual name in `user_metadata` will be corrected.
 - Rows without metadata will keep their old value; you can manually fix them when you have the data.

