import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://hrbsmoiqpgewrmusjulp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNtb2lxcGdld3JtdXNqdWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTg3MzgsImV4cCI6MjA5MjczNDczOH0.DalFoqa_9rfQLQ1jpwxEsaP19pXiTy6kYciB_mb3TSs"
);
