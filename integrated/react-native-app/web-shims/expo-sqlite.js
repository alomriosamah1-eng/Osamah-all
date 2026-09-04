// محاكي اختباري لـ expo-sqlite على الويب فقط (لا يُستخدم في أندرويد/آيفون)
// يسمح لطبقة البيانات بالعمل دون قاعدة بيانات حقيقية في بيئة المعاينة.
export const openDatabaseAsync = async () => {
  throw new Error('expo-sqlite غير مدعوم على الويب (محاكي المعاينة)');
};

export const openDatabaseSync = () => {
  throw new Error('expo-sqlite غير مدعوم على الويب (محاكي المعاينة)');
};

export const deleteDatabaseAsync = async () => {
  throw new Error('expo-sqlite غير مدعوم على الويب (محاكي المعاينة)');
};

export const SQLiteProvider = () => null;