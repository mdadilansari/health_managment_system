--
-- PostgreSQL database dump
--

\restrict 2k8hM9Db7md5egdtc9Aa5C03SgfqoPY42g9Szg1oAhNq5WN5wXhz5rma8pqk0Ib

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

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
-- Name: doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    doctor_id integer DEFAULT nextval('public.doctor_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    department character varying(100) NOT NULL,
    specialization character varying(100) NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (doctor_id, name, email, phone, department, specialization, created_at) FROM stdin;
1	Dr. Aditya Iyer	doc610@mail.com	9752166954	Cardiology	Cardiologist	2024-11-02 03:11:45
2	Dr. Pari Das	doc257@mail.com	9026850785	Orthopedics	Neurologist	2025-03-17 04:22:27
3	Dr. Karan Iyer	doc186@mail.com	9948944311	Pediatrics	Neurologist	2024-03-23 17:32:17
4	Dr. Raj Singh	doc38@mail.com	9433945965	Pediatrics	Cardiologist	2023-10-19 09:35:02
5	Dr. Neha Menon	doc638@mail.com	9767259461	Dermatology	Cardiologist	2023-09-04 00:45:57
6	Dr. Diya Singh	doc15@mail.com	9509941847	Dermatology	Neurologist	2024-10-07 10:36:09
7	Dr. Karan Khan	doc250@mail.com	9411571078	Neurology	Neurologist	2023-01-04 23:38:23
8	Dr. Diya Iyer	doc858@mail.com	9594153554	Neurology	Cardiologist	2024-01-06 23:18:57
9	Dr. Rohan Reddy	doc240@mail.com	9843493976	Orthopedics	Neurologist	2023-02-27 12:11:28
10	Dr. Aditya Singh	doc989@mail.com	9588454746	Orthopedics	Cardiologist	2024-12-30 07:52:41
11	Dr. Diya Menon	doc639@mail.com	9668883377	Dermatology	Cardiologist	2023-04-17 06:54:37
12	Dr. Ananya Iyer	doc233@mail.com	9740684690	Cardiology	Neurologist	2024-07-10 20:28:55
13	Dr. Pari Reddy	doc150@mail.com	9246116364	Dermatology	Cardiologist	2023-12-27 16:36:45
14	Dr. Karan Iyer	doc471@mail.com	9208961435	Pediatrics	Neurologist	2024-12-10 16:04:24
15	Dr. Diya Patel	doc394@mail.com	9813326083	Cardiology	Cardiologist	2025-07-31 00:28:21
16	Dr. Karan Iyer	doc795@mail.com	9763666768	Cardiology	Cardiologist	2024-04-24 21:51:09
17	Dr. Karan Sharma	doc594@mail.com	9319342783	Dermatology	Neurologist	2023-09-13 14:39:38
18	Dr. Diya Khan	doc991@mail.com	9873191987	Pediatrics	Neurologist	2023-05-21 06:44:06
19	Dr. Raj Sharma	doc271@mail.com	9546658912	Cardiology	Neurologist	2023-12-10 21:10:02
20	Dr. Vivaan Khan	doc932@mail.com	9761009125	Pediatrics	Neurologist	2024-07-30 08:18:42
21	Dr. Neha Reddy	doc602@mail.com	9714044903	Pediatrics	Neurologist	2024-01-02 18:55:01
22	Dr. Pari Verma	doc703@mail.com	9396029980	Orthopedics	Cardiologist	2023-03-20 13:42:12
23	Dr. Pari Patel	doc129@mail.com	9728558277	Dermatology	Cardiologist	2024-03-06 17:33:19
24	Dr. Aditya Gupta	doc554@mail.com	9216007231	Cardiology	Cardiologist	2024-10-15 22:32:49
25	Dr. Neha Verma	doc764@mail.com	9043542679	Dermatology	Neurologist	2024-12-12 13:03:46
29	Dr. Aditya Iyer	doc610@mail.com	9752166954	Cardiology	Cardiologist	2025-11-09 13:42:11.203
33	Dr. Almas	doc33@mail.com	9752166954	OBG	OBG	2025-11-09 15:11:28.726
35	Dr. Adil	doc34@mail.com	9752166954	ENT	ENT	2025-11-09 15:21:03.812
36	Dr. Adil	doc34@mail.com	9752166954	ENT	ENT	2025-11-09 15:40:01.127
37	Dr. Adil	doc34@mail.com	9752166954	ENT	ENT	2025-11-09 15:46:57.945
\.


--
-- Name: doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_id_seq', 37, true);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2k8hM9Db7md5egdtc9Aa5C03SgfqoPY42g9Szg1oAhNq5WN5wXhz5rma8pqk0Ib

