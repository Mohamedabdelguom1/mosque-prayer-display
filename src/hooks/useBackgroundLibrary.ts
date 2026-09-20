import { useEffect, useState } from 'react';

/** مدخل واحد في مكتبة الخلفيات، كما في public/bg/library.json */
export interface LibraryEntry {
  /** مسار نسبي كما يُكتب في اعدادات الخلفيات */
  file: string;
  /** اسم المسجد بالعربية، وهو ما يراه المشرف */
  nameAr: string;
  title: string;
  author: string;
  license: string;
  source: string;
  /** من الصور الست التي تُشحن مع التطبيق وتُخزَّن مسبقا */
  default?: boolean;
}

/**
 * يقرأ فهرس مكتبة الخلفيات.
 *
 * الفهرس ملف ساكن يُخزَّن مسبقا مع التطبيق، فيعمل الاختيار بلا انترنت
 * حتى لو لم تُنزَّل الصور نفسها بعد.
 */
export function useBackgroundLibrary(): LibraryEntry[] {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);

  useEffect(() => {
    let alive = true;

    fetch('./bg/library.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LibraryEntry[]) => {
        if (alive && Array.isArray(data)) setEntries(data);
      })
      .catch(() => {
        // فهرس مفقود لا يعطّل اللوحة: يبقى تحرير المسارات يدويا متاحا
      });

    return () => {
      alive = false;
    };
  }, []);

  return entries;
}
