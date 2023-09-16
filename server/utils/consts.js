const {MEDIA_ENDPOINT} = require('./env');

module.exports = {
    USER_STATUS: {
        ACTIVE: 1,
        INACTIVE: 2,
        SUSPEND: 3,
    },
    USER_ROLES: {
        ADMIN: 'admin',
        MENTOR: 'mentor',
        TEACHER: 'teacher',
        USER: 'user',
    },
    IMAGE_TYPE: {
        TEXT: 1,
        IMAGE: 2,
        AMINATION: 3,
    },
    LEVEL: {
        LEVEL_1: 1,
        LEVEL_2: 2,
    },
    EMAIL: {
        ADMIN_EMAIL: 'pokemoke@techplan.net',
        ADMIN_PASSWORD: 'XE:%9HpB@Stsj9Y',
    },
    QUESTION_STATUS: {
        ACTIVE: 1,
        INACTIVE: 2,
        SUSPEND: 3,
    },
    USER_ANSWER: {
        INCORRECT: 0,
        CORRECT: 1,
    },
    QUESTION_TYPE_CHILD: {
        A: '骨名称',
        B: '骨ランドマーク',
        C: '筋肉名称',
        D: '筋肉起始停止',
        E: '筋肉機能',
        F: '動き名称',
    },
    QUESTION_TYPE_PARENT: {
        A: '肩甲骨・肩関節',
        B: '肘関節・手関節',
        C: '股関節',
        D: '膝関節',
        E: '足関節',
        F: '脊柱',
    },
    FIELD_CSV: {
        TimeUsed: '利用時間',
        RankAverage: '総合ランク',
        A: '肩甲骨・肩関節',
        B: '肘関節・手関節',
        C: '股関節',
        D: '膝関節',
        E: '足関節',
        F: '脊柱',
        NumberTestA: '肩甲骨・肩関節 ',
        NumberTestB: '肘関節・手関節 ',
        NumberTestC: '股関節 ',
        NumberTestD: '膝関節 ',
        NumberTestE: '足関節 ',
        NumberTestF: '脊柱 ',
        NumberTestAptitude: '実力診断',
        HighScore: '実力診断・最高得点',
        Name: '名前',
        PersonalID: '個人ID',
        CountTest: 'テスト回数',
        ExpirationDate: '有効期限',
    },
    QUESTION_TYPE_STATUS: {
        ACTIVE: 1,
        INACTIVE: 2,
        SUSPEND: 3,
    },
    RANK: {
        S: 'S',
        A: 'A',
        B: 'B',
        C: 'C',
        D: 'D',
        G: 'G',
    },
    IS_DELETED: {
        NOT_DELETED: 0,
        DELETED: 1,
    },
    TYPE_EDUCATION: {
        EDUCATION: 1,
        MAJORS: 2,
        YEAR: 3,
    },
    URL_QUESTION_FORM: 'file_example/Question_data_example.xlsx',
    URL_USER_FORM: 'file_example/user_sample_data.xlsx',
    URL_BASE: `${MEDIA_ENDPOINT}/`,
    QUESTION_TYPE_FIELD: '_id parent_id name symbol status created_at updated_at',
    USER_FIELD:
        '_id full_name username email personal_id password role status usage_time hightest_score expiration_date schools faculty education_id created_at updated_at',
    USER_FIELD_LIST:
        '_id full_name username email personal_id role status usage_time hightest_score expiration_date schools faculty education_id created_at updated_at',
    USER_DETAIL_FIELD:
        'id full_name email username personal_id hightest_score role status usage_time expiration_date schools faculty education_id created_at updated_at',
    STATISTIC_FIELD:
        '_id user_id current_level child_type root_type rank date_rank total_correct created_at updated_at',
    QUESTION_FIELD:
        '_id title level root_type child_type last_type question_type_id image_type path_file option_1 option_2 option_3 option_4 correct_answer status created_at updated_at',
    QUESTION_FIELD_USER:
        '_id title level root_type child_type question_type_id image_type path_file option_1 option_2 option_3 option_4 correct_answer status created_at updated_at',
    QUESTION_DETAIL_FIELD:
        '_id title level root_type child_type_name last_type question_type_id image_type path_file option_1 option_2 option_3 option_4 correct_answer status created_at updated_at',
    ANSWER_FIELD: '_id question_id user_answer user_id created_at updated_at',
    TEST_FIELD: '_id user_id question_ids root_type spend_times score created_at updated_at',
    FEEDBACK_FIELD: '_id user_id question answer created_at updated_at',
    APTITUDE_TEST_FIELD: '_id user_id question_ids spend_times score created_at updated_at',
    APTITUDE_TEST_DETAIL_FIELD: '_id user_id spend_times score created_at updated_at',
    EDUCATION_FIELD: '_id name code parent_id type is_deleted created_at updated_at',
    ExcelFormatImportUser: ['No.', '学生氏名（漢字)', '個人ID', 'メールアドレス', '利用期限'],
    HEADERS_EXPORT_USER_CSV: [
        {id: 'id', title: 'Id'},
        {id: 'personal_id', title: 'Personal Id'},
        {id: 'usage_time', title: 'Usage Time'},
        {id: 'hightest_score', title: 'Hightest Score'},
        {id: 'count_test', title: 'Count Test'},
        {id: 'rank', title: 'Rank'},
        {id: 'statistic', title: 'Statistic'},
        {id: 'expiration_date', title: 'Expiration Date'},
    ],
};
