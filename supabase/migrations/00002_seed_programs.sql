-- =============================================================================
-- WeReciteTogether — Seed Data: 8 Programs + Tracks
-- =============================================================================

-- Program 1: Open Recitation (Free)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Open Recitation',
  'التلاوة المفتوحة',
  'Drop-in recitation sessions with available teachers. Join the queue and recite when a teacher is free.',
  'جلسات تلاوة مفتوحة مع المعلمين المتاحين. انضم للطابور واقرأ عندما يتوفر معلم.',
  'free'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Default Track', 'المسار الافتراضي', 'free', 0
);

-- Program 2: Quran Memorization (Structured)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'Quran Memorization',
  'حفظ القرآن الكريم',
  'Structured memorization program with cohort-based classes, progressive curriculum, and certification.',
  'برنامج حفظ منظم مع دفعات دراسية ومنهج تدريجي وشهادات.',
  'structured'
);

INSERT INTO program_tracks (program_id, name, name_ar, description, description_ar, track_type, curriculum, sort_order)
VALUES
  ('a1000000-0000-0000-0000-000000000002',
   'Juz 30 Track', 'مسار جزء عمّ',
   'Start with the 30th Juz — ideal for beginners',
   'ابدأ بجزء عمّ — مثالي للمبتدئين',
   'structured',
   '{"levels":[{"name":"المستوى الأول","name_en":"Level 1","description":"Surah An-Nas to Surah Ad-Duha","sort_order":1,"modules":[{"name":"سورة الناس - سورة الضحى","surah_range":[114,93],"estimated_weeks":12}]}]}'::jsonb,
   0),
  ('a1000000-0000-0000-0000-000000000002',
   'Full Quran Track', 'مسار القرآن الكامل',
   'Complete Quran memorization from Al-Baqarah to An-Nas',
   'حفظ القرآن الكريم كاملاً من البقرة إلى الناس',
   'structured',
   '{"levels":[{"name":"المرحلة الأولى","name_en":"Phase 1","description":"Juz 1-5","sort_order":1,"modules":[{"name":"الجزء الأول - الخامس","surah_range":[1,5],"estimated_weeks":40}]}]}'::jsonb,
   1);

-- Program 3: Tajweed Fundamentals (Structured)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'Tajweed Fundamentals',
  'أساسيات التجويد',
  'Learn the rules of Quranic recitation — from basic pronunciation to advanced tajweed rules.',
  'تعلم أحكام تلاوة القرآن — من النطق الأساسي إلى أحكام التجويد المتقدمة.',
  'structured'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES
  ('a1000000-0000-0000-0000-000000000003',
   'Beginner Tajweed', 'التجويد للمبتدئين', 'structured', 0),
  ('a1000000-0000-0000-0000-000000000003',
   'Advanced Tajweed', 'التجويد المتقدم', 'structured', 1);

-- Program 4: Quran Review (Free)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'Quran Review',
  'مراجعة القرآن',
  'For those who have memorized and want to maintain their memorization with regular review sessions.',
  'لمن أتمّ الحفظ ويريد المحافظة على حفظه بجلسات مراجعة منتظمة.',
  'free'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'Default Track', 'المسار الافتراضي', 'free', 0
);

-- Program 5: Children's Program (Structured)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'Children''s Program',
  'برنامج الأطفال',
  'Age-appropriate Quran learning for children under 13 with parental oversight and engaging activities.',
  'تعليم القرآن بطريقة مناسبة للأطفال دون 13 سنة مع إشراف أولياء الأمور وأنشطة تفاعلية.',
  'structured'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES
  ('a1000000-0000-0000-0000-000000000005',
   'Ages 5-8', 'الأعمار 5-8', 'structured', 0),
  ('a1000000-0000-0000-0000-000000000005',
   'Ages 9-12', 'الأعمار 9-12', 'structured', 1);

-- Program 6: Weekend Intensive (Mixed)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  'Weekend Intensive',
  'المكثف الأسبوعي',
  'Intensive weekend sessions combining structured cohort classes with drop-in recitation practice.',
  'جلسات مكثفة في عطلة نهاية الأسبوع تجمع بين دفعات منظمة وتلاوة حرة.',
  'mixed'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES
  ('a1000000-0000-0000-0000-000000000006',
   'Structured Cohort', 'الدفعة المنظمة', 'structured', 0),
  ('a1000000-0000-0000-0000-000000000006',
   'Open Practice', 'التدريب المفتوح', 'free', 1);

-- Program 7: New Muslim Program (Structured)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000007',
  'New Muslim Program',
  'برنامج المسلمين الجدد',
  'Beginner-friendly program for new Muslims to learn Quran reading, basic surahs, and tajweed.',
  'برنامج ميسّر للمسلمين الجدد لتعلم قراءة القرآن والسور الأساسية والتجويد.',
  'structured'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000007',
  'Foundation Track', 'المسار التأسيسي', 'structured', 0
);

-- Program 8: Ijazah Preparation (Structured)
INSERT INTO programs (id, name, name_ar, description, description_ar, category)
VALUES (
  'a1000000-0000-0000-0000-000000000008',
  'Ijazah Preparation',
  'إعداد الإجازة',
  'Advanced certification track for students seeking an ijazah in Quran recitation with a connected chain of transmission.',
  'مسار متقدم للطلاب الساعين للحصول على إجازة في تلاوة القرآن بسند متصل.',
  'structured'
);

INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000008',
  'Hafs an Asim', 'حفص عن عاصم', 'structured', 0
);
