import { jsonFromReply, runQuery } from "../utils/octoClient";
export async function creativeQuery<T>(
  name: string,
  params: unknown[] = [],
): Promise<T> {
  if (
    !/^(creative_open|creative_get|creative_save|creative_profile|creative_google|creative_invite|creative_join|creative_publish|creative_public|creative_community|creative_logout|creative_rotate|creative_media_get|creative_media_save|creative_media_save_once|creative_media_save_file|creative_motion_start|creative_motion_finish|creative_motion_get|creative_post_comments_list|creative_post_comment_add|creative_post_comment_remove|creative_work_comments_list|creative_work_comment_add|creative_work_comment_remove|creative_event_log|creative_events_list|creative_events_clear|creative_hosted_list|creative_hosted_save|creative_hosted_remove|creative_hosted_going|creative_publication_mine|creative_publication_withdraw|creative_publication_comments|creative_board_open|creative_board_close|creative_boards_list|creative_board_ask|creative_board_answer|creative_board_places|creative_idea_add|creative_ideas_list|creative_idea_answer|creative_idea_remove|creative_follow_set|creative_follow_migrate|creative_follows_mine|creative_follow_counts|creative_person_public|creative_following_feed|creative_authors|creative_competition_list|creative_competition_save|creative_competition_close|creative_competition_enter|creative_competition_withdraw|creative_competition_vote|creative_moodboard_get)$/.test(
      name,
    )
  )
    throw new Error("STORAGE_POLICY");
  const sql = `SELECT kresilo_demo.${name}(${params.map((_, i) => "$" + (i + 1)).join(",")}) AS result`;
  // Lists go as JSON text: the workspace would read a bare array as a Postgres
  // array, and every list a command takes is a jsonb parameter.
  const sent = params.map((p) => (Array.isArray(p) ? JSON.stringify(p) : p));
  const reply = jsonFromReply(await runQuery(sql, sent));
  if ("code" in reply)
    throw new Error(
      reply.code === "STORAGE_SETUP_REQUIRED" ? reply.code : "STORAGE_ERROR",
    );
  const envelope = reply.value as { ok: boolean; code?: string; data: T };
  if (!envelope.ok) throw new Error(envelope.code ?? "STORAGE_ERROR");
  return envelope.data;
}
