--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    type character varying DEFAULT 'general'::character varying,
    target_role character varying DEFAULT 'all'::character varying,
    is_active boolean DEFAULT true,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    restricted_start_date date,
    restricted_end_date date
);


ALTER TABLE public.announcements OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    sender_id character varying NOT NULL,
    message_type character varying DEFAULT 'text'::character varying,
    content text,
    file_url text,
    file_name text,
    file_size integer,
    is_edited boolean DEFAULT false,
    reply_to_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chat_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'file'::character varying, 'voice'::character varying, 'location'::character varying])::text[])))
);


ALTER TABLE public.chat_messages OWNER TO neondb_owner;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO neondb_owner;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_rooms (
    id integer NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    participants text[] NOT NULL,
    created_by character varying NOT NULL,
    is_active boolean DEFAULT true,
    last_activity timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chat_rooms_type_check CHECK (((type)::text = ANY ((ARRAY['group'::character varying, 'direct'::character varying, 'announcement'::character varying])::text[])))
);


ALTER TABLE public.chat_rooms OWNER TO neondb_owner;

--
-- Name: chat_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_rooms_id_seq OWNER TO neondb_owner;

--
-- Name: chat_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_rooms_id_seq OWNED BY public.chat_rooms.id;


--
-- Name: check_in_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.check_in_products (
    id integer NOT NULL,
    check_in_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.check_in_products OWNER TO neondb_owner;

--
-- Name: check_in_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.check_in_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.check_in_products_id_seq OWNER TO neondb_owner;

--
-- Name: check_in_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.check_in_products_id_seq OWNED BY public.check_in_products.id;


--
-- Name: check_ins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.check_ins (
    id integer NOT NULL,
    employee_id character varying NOT NULL,
    company_id integer NOT NULL,
    schedule_id integer,
    check_in_time timestamp without time zone DEFAULT now(),
    check_out_time timestamp without time zone,
    check_in_latitude numeric(10,8),
    check_in_longitude numeric(11,8),
    check_out_latitude numeric(10,8),
    check_out_longitude numeric(11,8),
    photo_url text,
    notes text,
    status character varying DEFAULT 'checked_in'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.check_ins OWNER TO neondb_owner;

--
-- Name: check_ins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.check_ins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.check_ins_id_seq OWNER TO neondb_owner;

--
-- Name: check_ins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.check_ins_id_seq OWNED BY public.check_ins.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying NOT NULL,
    address text,
    contact_person character varying,
    contact_phone character varying,
    contact_email character varying,
    requires_photo boolean DEFAULT false,
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.companies OWNER TO neondb_owner;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO neondb_owner;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: message_read_receipts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_read_receipts (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id character varying NOT NULL,
    read_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.message_read_receipts OWNER TO neondb_owner;

--
-- Name: message_read_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.message_read_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_read_receipts_id_seq OWNER TO neondb_owner;

--
-- Name: message_read_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.message_read_receipts_id_seq OWNED BY public.message_read_receipts.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    type character varying NOT NULL,
    related_id integer,
    is_read boolean DEFAULT false,
    priority character varying DEFAULT 'normal'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT notifications_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['task'::character varying, 'shift'::character varying, 'chat'::character varying, 'announcement'::character varying, 'timeoff'::character varying, 'poll'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: poll_responses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.poll_responses (
    id integer NOT NULL,
    poll_id integer NOT NULL,
    user_id character varying NOT NULL,
    selected_options text[] NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.poll_responses OWNER TO neondb_owner;

--
-- Name: poll_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.poll_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_responses_id_seq OWNER TO neondb_owner;

--
-- Name: poll_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.poll_responses_id_seq OWNED BY public.poll_responses.id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.polls (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    options jsonb NOT NULL,
    target_roles text[] NOT NULL,
    created_by character varying NOT NULL,
    expires_at timestamp without time zone,
    allow_multiple_choices boolean DEFAULT false,
    is_anonymous boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.polls OWNER TO neondb_owner;

--
-- Name: polls_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.polls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.polls_id_seq OWNER TO neondb_owner;

--
-- Name: polls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.polls_id_seq OWNED BY public.polls.id;


--
-- Name: positions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.positions (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.positions OWNER TO neondb_owner;

--
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.positions_id_seq OWNER TO neondb_owner;

--
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- Name: pre_registered_employees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pre_registered_employees (
    id integer NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    "position" character varying,
    company_id integer,
    is_used boolean DEFAULT false,
    registered_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pre_registered_employees OWNER TO neondb_owner;

--
-- Name: pre_registered_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pre_registered_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pre_registered_employees_id_seq OWNER TO neondb_owner;

--
-- Name: pre_registered_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pre_registered_employees_id_seq OWNED BY public.pre_registered_employees.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    category character varying,
    unit character varying DEFAULT 'pcs'::character varying,
    is_active boolean DEFAULT true,
    is_custom boolean DEFAULT false,
    added_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.schedules (
    id integer NOT NULL,
    employee_id character varying NOT NULL,
    company_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    status character varying DEFAULT 'scheduled'::character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.schedules OWNER TO neondb_owner;

--
-- Name: schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedules_id_seq OWNER TO neondb_owner;

--
-- Name: schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.schedules_id_seq OWNED BY public.schedules.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: shift_swap_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shift_swap_requests (
    id integer NOT NULL,
    requester_id character varying NOT NULL,
    original_shift_id integer NOT NULL,
    target_shift_id integer,
    coverage_only boolean DEFAULT false,
    reason text,
    status character varying DEFAULT 'pending'::character varying,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT shift_swap_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'peer_approved'::character varying])::text[])))
);


ALTER TABLE public.shift_swap_requests OWNER TO neondb_owner;

--
-- Name: shift_swap_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shift_swap_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_swap_requests_id_seq OWNER TO neondb_owner;

--
-- Name: shift_swap_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shift_swap_requests_id_seq OWNED BY public.shift_swap_requests.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shifts (
    id integer NOT NULL,
    employee_id character varying NOT NULL,
    title character varying NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    break_duration integer DEFAULT 0,
    company_id integer,
    is_recurring boolean DEFAULT false,
    recurring_pattern character varying,
    recurring_days text[],
    status character varying DEFAULT 'scheduled'::character varying,
    overtime_hours numeric DEFAULT 0,
    created_by character varying NOT NULL,
    reminder_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT shifts_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.shifts OWNER TO neondb_owner;

--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_id_seq OWNER TO neondb_owner;

--
-- Name: shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shifts_id_seq OWNED BY public.shifts.id;


--
-- Name: task_updates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_updates (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id character varying NOT NULL,
    status character varying NOT NULL,
    comment text,
    photo_url text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    hours_worked numeric,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT task_updates_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.task_updates OWNER TO neondb_owner;

--
-- Name: task_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_updates_id_seq OWNER TO neondb_owner;

--
-- Name: task_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_updates_id_seq OWNED BY public.task_updates.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    assigned_to character varying NOT NULL,
    assigned_by character varying NOT NULL,
    company_id integer,
    priority character varying DEFAULT 'medium'::character varying,
    status character varying DEFAULT 'pending'::character varying,
    due_date timestamp without time zone,
    requires_photo boolean DEFAULT false,
    requires_location boolean DEFAULT false,
    estimated_hours numeric,
    actual_hours numeric,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.tasks OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: time_off_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.time_off_requests (
    id integer NOT NULL,
    employee_id character varying NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status character varying DEFAULT 'pending'::character varying,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.time_off_requests OWNER TO neondb_owner;

--
-- Name: time_off_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.time_off_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_off_requests_id_seq OWNER TO neondb_owner;

--
-- Name: time_off_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.time_off_requests_id_seq OWNED BY public.time_off_requests.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'employee'::character varying,
    "position" character varying,
    phone character varying,
    company_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_rooms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_rooms ALTER COLUMN id SET DEFAULT nextval('public.chat_rooms_id_seq'::regclass);


--
-- Name: check_in_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_in_products ALTER COLUMN id SET DEFAULT nextval('public.check_in_products_id_seq'::regclass);


--
-- Name: check_ins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins ALTER COLUMN id SET DEFAULT nextval('public.check_ins_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: message_read_receipts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_read_receipts ALTER COLUMN id SET DEFAULT nextval('public.message_read_receipts_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: poll_responses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.poll_responses ALTER COLUMN id SET DEFAULT nextval('public.poll_responses_id_seq'::regclass);


--
-- Name: polls id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.polls ALTER COLUMN id SET DEFAULT nextval('public.polls_id_seq'::regclass);


--
-- Name: positions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);


--
-- Name: pre_registered_employees id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_registered_employees ALTER COLUMN id SET DEFAULT nextval('public.pre_registered_employees_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: schedules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schedules ALTER COLUMN id SET DEFAULT nextval('public.schedules_id_seq'::regclass);


--
-- Name: shift_swap_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shift_swap_requests ALTER COLUMN id SET DEFAULT nextval('public.shift_swap_requests_id_seq'::regclass);


--
-- Name: shifts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id SET DEFAULT nextval('public.shifts_id_seq'::regclass);


--
-- Name: task_updates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_updates ALTER COLUMN id SET DEFAULT nextval('public.task_updates_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: time_off_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_off_requests ALTER COLUMN id SET DEFAULT nextval('public.time_off_requests_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.announcements (id, title, content, type, target_role, is_active, created_by, created_at, updated_at, restricted_start_date, restricted_end_date) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_messages (id, room_id, sender_id, message_type, content, file_url, file_name, file_size, is_edited, reply_to_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_rooms (id, name, type, participants, created_by, is_active, last_activity, created_at) FROM stdin;
\.


--
-- Data for Name: check_in_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.check_in_products (id, check_in_id, product_id, quantity, notes, created_at) FROM stdin;
\.


--
-- Data for Name: check_ins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.check_ins (id, employee_id, company_id, schedule_id, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude, photo_url, notes, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.companies (id, name, address, contact_person, contact_phone, contact_email, requires_photo, latitude, longitude, is_active, created_at, updated_at) FROM stdin;
1	Gopalan	ssss	Shafiq	5555	test@gail.com	f	\N	\N	t	2025-07-01 13:55:00.974381	2025-07-01 13:55:00.974381
\.


--
-- Data for Name: message_read_receipts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_read_receipts (id, message_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, title, message, type, related_id, is_read, priority, created_at) FROM stdin;
\.


--
-- Data for Name: poll_responses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.poll_responses (id, poll_id, user_id, selected_options, created_at) FROM stdin;
\.


--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.polls (id, title, description, options, target_roles, created_by, expires_at, allow_multiple_choices, is_anonymous, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.positions (id, title, description, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: pre_registered_employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pre_registered_employees (id, email, phone, first_name, last_name, "position", company_id, is_used, registered_by, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, description, category, unit, is_active, is_custom, added_by, created_at, updated_at) FROM stdin;
1	Safety Gloves	Standard safety gloves for field work	Safety Equipment	pairs	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
2	Hard Hat	Safety helmet for construction sites	Safety Equipment	pcs	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
3	First Aid Kit	Basic first aid supplies	Medical	kit	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
4	Tool Box	Portable tool storage	Equipment	pcs	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
5	Measuring Tape	25ft measuring tape	Tools	pcs	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
6	Spray Paint	Marking spray paint	Supplies	cans	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
7	Cable Ties	Plastic cable ties	Fasteners	pack	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
8	LED Flashlight	High-power LED flashlight	Equipment	pcs	t	f	\N	2025-07-01 10:56:31.615191	2025-07-01 10:56:31.615191
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.schedules (id, employee_id, company_id, title, description, start_date, end_date, start_time, end_time, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
Rje41vJTGCds8m88XJCDf7780aj5HMrj	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-08T13:55:20.458Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "ba82c1de-68d9-4509-9553-b91dcf0d9c18", "exp": 1751381720, "iat": 1751378120, "iss": "https://replit.com/oidc", "sub": "44466055", "email": "sunbee1922@gmail.com", "at_hash": "5VfiwUZX5ApPLXZ1PYNrBA", "username": "sunbee1922", "auth_time": 1751378119, "last_name": null, "first_name": null}, "expires_at": 1751381720, "access_token": "UtYSSy9a3_MOpp8vncc7snD9-vkp1_ZttEG_4mX-DTz", "refresh_token": "yqmwJ1GW24Whkuh2Ys9G4Cnkj1LmIupMUNeCXWbacsi"}}}	2025-07-08 15:02:34
HUS9DUIfBGX-fMHXvxDRzMjcp_ZJ_8C7	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-08T12:24:58.233Z", "httpOnly": true, "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"aud": "86ee28ca-ee0a-4b31-9a2f-40a3b3b98e76", "exp": 1751376298, "iat": 1751372698, "iss": "https://replit.com/oidc", "sub": "31229296", "email": "sand1922@gmail.com", "at_hash": "-NWRoWd5eUOHsff1vZ1-mA", "username": "sand1922", "auth_time": 1751372697, "last_name": "Pillai", "first_name": "Sunil "}, "expires_at": 1751376298, "access_token": "n_D8FgCOBRh84O8RwmGEfkob7IsH-CLIguvU11sNcQg", "refresh_token": "5zQJsrYe14G4D5bvV2T5_iuoyg2ib0ojfAY0vZ7MWI6"}}}	2025-07-08 12:41:15
Z3Z2QOXaodsLQ36zjDZ7u-2osNMnO_wQ	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-08T10:36:24.260Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "D_wWNoDiarsohrWKQfVWcCFsMs3Q_O8OU7oCN3lzKo4"}}	2025-07-08 10:36:25
wwVAJeGnp17ZgCOWNRgCrq-rte9sIOS3	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-08T14:29:28.884Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "51b69111-21fc-4772-ab44-8e04b320b3b4", "exp": 1751383768, "iat": 1751380168, "iss": "https://replit.com/oidc", "sub": "44466055", "email": "sunbee1922@gmail.com", "at_hash": "s8XLFebDPOIj8HmGixPwnw", "username": "sunbee1922", "auth_time": 1751376086, "last_name": null, "first_name": null}, "expires_at": 1751383768, "access_token": "Phhgf24oIhOsOddrZF2QZddEQRR26vzbKyUHFjYCGir", "refresh_token": "mhVTKhrRaI5-0mNEFkWof2DhWQiG9gOLzPCfpjeo7zX"}}}	2025-07-08 15:00:42
hjEloFC_jAAPDUhq6Pu0zfiHeeNbI_-D	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-08T13:52:19.339Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "ba82c1de-68d9-4509-9553-b91dcf0d9c18", "exp": 1751381539, "iat": 1751377939, "iss": "https://replit.com/oidc", "sub": "31229296", "email": "sand1922@gmail.com", "at_hash": "E_HthT5A7JsJetfdW0c73g", "username": "sand1922", "auth_time": 1751377938, "last_name": "Pillai", "first_name": "Sunil "}, "expires_at": 1751381539, "access_token": "UhgvQ1wlJkyKi7dVs40Y9oh0SZfpGiquyNJGh1HKAGF", "refresh_token": "VeGu-IQQgfqf7_9N2QTD5SHybkeMNDPqTmbA71IGNc9"}}}	2025-07-08 15:01:22
XGOQ10HKlTsKcD5X3z6teZkb-mhkgSja	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-08T13:47:52.897Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "51b69111-21fc-4772-ab44-8e04b320b3b4", "exp": 1751381272, "iat": 1751377672, "iss": "https://replit.com/oidc", "sub": "44449606", "email": "sunil.v.pillai@outlook.com", "at_hash": "q4vU-46BUbn-aHswdauDOg", "username": "sunilvpillai", "auth_time": 1751366169, "last_name": "Valsalan", "first_name": "Sunil"}, "expires_at": 1751381272, "access_token": "GVNzNtHzX78t30FCRQgFPj0_hif50VMG2v7IlQmYR53", "refresh_token": "VMnYUpx6PdnDRrrAagHK0QBjo9vTHpb0MSKR1v64KJt"}}, "replit.com": {"code_verifier": "ExP6lbzsSNvKed8Nbow2Z78nslq0XkzQfOAUkLgDVCU"}}	2025-07-08 14:32:35
\.


--
-- Data for Name: shift_swap_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shift_swap_requests (id, requester_id, original_shift_id, target_shift_id, coverage_only, reason, status, approved_by, approved_at, rejection_reason, created_at) FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shifts (id, employee_id, title, start_time, end_time, break_duration, company_id, is_recurring, recurring_pattern, recurring_days, status, overtime_hours, created_by, reminder_sent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_updates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_updates (id, task_id, user_id, status, comment, photo_url, latitude, longitude, hours_worked, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, title, description, assigned_to, assigned_by, company_id, priority, status, due_date, requires_photo, requires_location, estimated_hours, actual_hours, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: time_off_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.time_off_requests (id, employee_id, start_date, end_date, reason, status, approved_by, approved_at, rejection_reason, created_at, updated_at) FROM stdin;
1	44466055	2025-07-01	2025-07-02	testing	pending	\N	\N	\N	2025-07-01 13:10:42.56145	2025-07-01 13:10:42.56145
2	44466055	2025-07-01	2025-07-01	sssss	pending	\N	\N	\N	2025-07-01 14:24:24.984552	2025-07-01 14:24:24.984552
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, "position", phone, company_id, is_active, created_at, updated_at) FROM stdin;
31229296	sand1922@gmail.com	Sunil 	Pillai	\N	admin	\N	\N	\N	t	2025-07-01 13:52:19.256822	2025-07-01 13:52:19.256822
44466055	sunbee1922@gmail.com	\N	\N	\N	employee	\N	\N	\N	t	2025-07-01 13:55:20.340974	2025-07-01 13:55:20.340974
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: chat_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_rooms_id_seq', 1, false);


--
-- Name: check_in_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.check_in_products_id_seq', 1, false);


--
-- Name: check_ins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.check_ins_id_seq', 1, false);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.companies_id_seq', 1, true);


--
-- Name: message_read_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.message_read_receipts_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: poll_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.poll_responses_id_seq', 1, false);


--
-- Name: polls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.polls_id_seq', 1, false);


--
-- Name: positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.positions_id_seq', 1, false);


--
-- Name: pre_registered_employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pre_registered_employees_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 8, true);


--
-- Name: schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.schedules_id_seq', 1, false);


--
-- Name: shift_swap_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shift_swap_requests_id_seq', 1, false);


--
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shifts_id_seq', 1, false);


--
-- Name: task_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.task_updates_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: time_off_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.time_off_requests_id_seq', 2, true);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: check_in_products check_in_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_in_products
    ADD CONSTRAINT check_in_products_pkey PRIMARY KEY (id);


--
-- Name: check_ins check_ins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: message_read_receipts message_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_read_receipts
    ADD CONSTRAINT message_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: poll_responses poll_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.poll_responses
    ADD CONSTRAINT poll_responses_pkey PRIMARY KEY (id);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: pre_registered_employees pre_registered_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_registered_employees
    ADD CONSTRAINT pre_registered_employees_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: shift_swap_requests shift_swap_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: task_updates task_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_updates
    ADD CONSTRAINT task_updates_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: time_off_requests time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_off_requests
    ADD CONSTRAINT time_off_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: chat_messages chat_messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id);


--
-- Name: chat_messages chat_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- Name: message_read_receipts message_read_receipts_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_read_receipts
    ADD CONSTRAINT message_read_receipts_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id);


--
-- Name: poll_responses poll_responses_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.poll_responses
    ADD CONSTRAINT poll_responses_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id);


--
-- Name: shift_swap_requests shift_swap_requests_original_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_original_shift_id_fkey FOREIGN KEY (original_shift_id) REFERENCES public.shifts(id);


--
-- Name: shift_swap_requests shift_swap_requests_target_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_target_shift_id_fkey FOREIGN KEY (target_shift_id) REFERENCES public.shifts(id);


--
-- Name: task_updates task_updates_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_updates
    ADD CONSTRAINT task_updates_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

