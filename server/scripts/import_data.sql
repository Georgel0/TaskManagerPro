--
-- PostgreSQL database dump
--

\restrict WshrVc2CGYAzgZAJrDoFgdN3OcGbyyPEOdn7ugBYE2AmguHvIAJlbbhCv4WWaj1

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-28 14:34:49

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5095 (class 0 OID 16390)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, avatar, created_at, reset_token, reset_token_expires, bio) FROM stdin;
2	Georgel	georgelgarabajiu07@gmail.com	$2b$10$OKcMAsGFD2R6h0DOnf2htOuUVMPC9jJDAWXN25Q47KFlzNYGwtHOa	https://img.wattpad.com/story_parts/1367662219/images/177938cea9e49e40876106651264.jpg	2026-03-30 14:26:45.098599	\N	\N	\N
1	Tester	test@gmail.com	$2b$10$EzKCQ1J8NhvU9VYK3JXksOI2bB7.GsfV70KPMSvhQODgXHlOr.yXS	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABNklEQVR4AeyYTQ4CMQiFm7mPXtC1F9QDaVi4cTGPRiSUfpOwMCA/j6+TZo7X5s8xNn8QYHMABgRAwOYKcAQ2ByDuJXh7XofHlOCeHBaj8nj9HAGvUl3jIKDrZr1zQYBXqS5x33NAwLciu/0+7FLhsdWE8cxkMRyB1TYb3S8ERCu6Wj4IWG1j0f1CQLSiq+VzE2CXhjPLHvysF/N5+3EL4El4vzyGMpVH/d/8KseMP1SAmcJVYhGgyib+1YfKCwFKoe5+COi+YTUfBNjFQplSsapfzWV+CKi6vay+ICBL6ap1IKDqZrL6ggD7eqIsahuqzsefWQ8CotSukme2DwiYVaxbPAR02+jsPBAwq1i3eAiwryJRlkVHVL+WBwKytla1DgRU3UxWXxCQpXTVOhBQdTPevn6NewMAAP//X0rquwAAAAZJREFUAwAY4OxoO4+RNAAAAABJRU5ErkJggg==	2026-03-26 11:56:21.314472	\N	\N	
\.


--
-- TOC entry 5097 (class 0 OID 16406)
-- Dependencies: 222
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, owner_id, created_at, is_archived, archived_at) FROM stdin;
12	Task Manager Pro		1	2026-04-27 12:09:55.91183	f	\N
\.


--
-- TOC entry 5108 (class 0 OID 24624)
-- Dependencies: 233
-- Data for Name: project_announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_announcements (id, project_id, author_id, title, content, type, is_pinned, created_at) FROM stdin;
\.


--
-- TOC entry 5109 (class 0 OID 24648)
-- Dependencies: 234
-- Data for Name: announcement_acknowledgments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcement_acknowledgments (announcement_id, user_id, acknowledged_at) FROM stdin;
\.


--
-- TOC entry 5100 (class 0 OID 16440)
-- Dependencies: 225
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, status, priority, deadline, project_id, assigned_user_id, created_at, is_archived, archived_at) FROM stdin;
14	FInish archive feature		Done	Medium	2026-05-01	12	1	2026-04-27 12:10:19.231789	f	\N
15	Test	testing stuff	In Progress	High	\N	12	2	2026-04-27 12:10:47.087768	f	\N
18	afdasf	sadfsdf	To Do	Medium	\N	\N	1	2026-04-27 14:52:41.481015	f	\N
\.


--
-- TOC entry 5104 (class 0 OID 16486)
-- Dependencies: 229
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attachments (id, task_id, file_path, uploaded_at, user_id, public_id, original_name, file_type, file_size) FROM stdin;
10	15	https://res.cloudinary.com/dve2a6ery/image/upload/v1777281827/taskmanager/tasks/15/file_inv9hc.png	2026-04-27 12:23:45.720747	1	taskmanager/tasks/15/file_inv9hc	Screenshot 2026-04-27 110436.png	image/png	25463
\.


--
-- TOC entry 5102 (class 0 OID 16464)
-- Dependencies: 227
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, task_id, user_id, comment, created_at, updated_at) FROM stdin;
10	15	1	test test	2026-04-27 12:23:18.579503	\N
11	15	1	test again	2026-04-27 12:23:25.906574	\N
\.


--
-- TOC entry 5112 (class 0 OID 32840)
-- Dependencies: 237
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (user_id, task_assigned, task_updated, task_completed, task_deleted, comment_added, project_changes, deadline_reminders, announcements, account_actions) FROM stdin;
1	f	f	f	f	f	f	f	f	f
\.


--
-- TOC entry 5106 (class 0 OID 16503)
-- Dependencies: 231
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, read_status, created_at) FROM stdin;
46	2	The project "Test" has been renamed to "Task Manager Pro".	f	2026-04-24 13:24:50.129808
47	2	You have been added to the project: Task Manager Pro	f	2026-04-27 11:49:16.997463
48	2	The project "Task Manager Pro" has been deleted by the owner.	f	2026-04-27 11:52:17.050515
49	2	You have been added to the project: Task Manager Pro	f	2026-04-27 11:52:29.242883
50	2	The project "Task Manager Pro" has been deleted by the owner.	f	2026-04-27 12:09:42.812957
51	2	You have been added to the project: Task Manager Pro	f	2026-04-27 12:09:55.945816
52	2	You have been assigned to a new task: Test	f	2026-04-27 12:10:47.098196
53	2	Tester commented on your task: "Test"	f	2026-04-27 12:23:18.596203
54	2	Tester commented on your task: "Test"	f	2026-04-27 12:23:25.910077
55	2	A file was attached to your task: "Test"	f	2026-04-27 12:23:45.741155
\.


--
-- TOC entry 5098 (class 0 OID 16422)
-- Dependencies: 223
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_members (project_id, user_id, role_description) FROM stdin;
12	2	\N
\.


--
-- TOC entry 5111 (class 0 OID 32820)
-- Dependencies: 236
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) FROM stdin;
5	1	https://fcm.googleapis.com/fcm/send/f4GH9ziWfhU:APA91bHdFRX_WlaiCcRopWvDTpvmuJ-rtcJLL7UdpH7I4g49kpLl_B7RoO-RdoYzZRfCOWux0aOCEE4zKcvPJ7A_QWnuSSWZeOLws91vxTTO4frTTY2dC59II5cFidx0DNx6G_x9iKLC	BG7Wih85cQCz4p1dY5tOOeJnhpola6BhHXnzbjObcUCPSA9DW0S0lQDm3rjD3dWbFI5D9tR3VfXzbgu4rKugLFw	1crsP9KEkMNtMGvjedGpIA	2026-04-24 12:26:34.177306
\.


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 228
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attachments_id_seq', 10, true);


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 226
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 11, true);


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 230
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 55, true);


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 232
-- Name: project_announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_announcements_id_seq', 10, true);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 221
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 12, true);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 235
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 5, true);


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 224
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 18, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


-- Completed on 2026-04-28 14:34:49

--
-- PostgreSQL database dump complete
--

\unrestrict WshrVc2CGYAzgZAJrDoFgdN3OcGbyyPEOdn7ugBYE2AmguHvIAJlbbhCv4WWaj1

