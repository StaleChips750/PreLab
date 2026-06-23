-- Pin search_path on helper/trigger functions (security lint 0011)
alter function public.bump_count(regclass, text, uuid, int) set search_path = public;
alter function public.likes_count_trg() set search_path = public;
alter function public.saves_count_trg() set search_path = public;

-- Trigger/definer functions must NOT be callable via the REST API (0028/0029)
revoke all on function public.handle_new_user()        from anon, authenticated, public;
revoke all on function public.bump_count(regclass, text, uuid, int) from anon, authenticated, public;
revoke all on function public.likes_count_trg()        from anon, authenticated, public;
revoke all on function public.saves_count_trg()        from anon, authenticated, public;
