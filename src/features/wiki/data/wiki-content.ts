import type { WikiRole, WikiContentConfig } from '../types/wiki.types';
import { studentSections } from './student-sections';
import { teacherSections } from './teacher-sections';
import { supervisorSections } from './supervisor-sections';
import { programAdminSections } from './program-admin-sections';
import { masterAdminSections } from './master-admin-sections';

export const wikiContentByRole: Record<WikiRole, WikiContentConfig> = {
  student: {
    pageTitleKey: 'wiki.pageTitle',
    introKey: 'wiki.student.intro',
    sections: studentSections,
  },
  teacher: {
    pageTitleKey: 'wiki.pageTitle',
    introKey: 'wiki.teacher.intro',
    sections: teacherSections,
  },
  supervisor: {
    pageTitleKey: 'wiki.pageTitle',
    introKey: 'wiki.supervisor.intro',
    sections: supervisorSections,
  },
  program_admin: {
    pageTitleKey: 'wiki.pageTitle',
    introKey: 'wiki.programAdmin.intro',
    sections: programAdminSections,
  },
  master_admin: {
    pageTitleKey: 'wiki.pageTitle',
    introKey: 'wiki.masterAdmin.intro',
    sections: masterAdminSections,
  },
};
