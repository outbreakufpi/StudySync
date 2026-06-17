const apiServerUrl = process.env.API_SERVER_URL || 'http://localhost:3001';

const bearerAuth = {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
	description: 'Use o access token retornado no login. Os endpoints também aceitam o cookie HttpOnly access_token em navegadores.',
};

const commonErrorSchema = {
	type: 'object',
	properties: {
		error: { type: 'string' },
	},
	required: ['error'],
};

const profileSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		auth_uid: { type: 'string' },
		email: { type: 'string', nullable: true },
		full_name: { type: 'string', nullable: true },
		current_mode: { type: 'string', enum: ['university', 'competitive'] },
		metadata: { type: 'object', additionalProperties: true },
		updated_at: { type: 'string', format: 'date-time', nullable: true },
	},
};

const userSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		email: { type: 'string', nullable: true },
		role: { type: 'string', nullable: true },
		user_metadata: { type: 'object', additionalProperties: true },
		profile: profileSchema,
	},
};

const authResponseSchema = {
	type: 'object',
	properties: {
		user: userSchema,
		session: {
			type: 'object',
			nullable: true,
			additionalProperties: true,
		},
		profile: profileSchema,
		valid: { type: 'boolean', nullable: true },
		message: { type: 'string', nullable: true },
	},
};

const subjectSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		user_id: { type: 'string' },
		name: { type: 'string' },
		professor: { type: 'string', nullable: true },
		room: { type: 'string', nullable: true },
		color: { type: 'string', nullable: true },
		code: { type: 'string', nullable: true },
		mode: { type: 'string', enum: ['university', 'competitive'] },
		is_active: { type: 'boolean', nullable: true },
		metadata: { type: 'object', additionalProperties: true },
		created_at: { type: 'string', format: 'date-time', nullable: true },
		updated_at: { type: 'string', format: 'date-time', nullable: true },
	},
};

const taskSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		user_id: { type: 'string' },
		subject_id: { type: 'string', nullable: true },
		title: { type: 'string' },
		description: { type: 'string', nullable: true },
		type: { type: 'string' },
		status: { type: 'string' },
		priority: { type: 'integer', nullable: true },
		due_date: { type: 'string', format: 'date-time', nullable: true },
		estimated_minutes: { type: 'number', nullable: true },
		recurrence: { type: 'string', nullable: true },
		tags: { type: 'array', items: { type: 'string' } },
		metadata: { type: 'object', additionalProperties: true },
		subject: {
			type: 'object',
			nullable: true,
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
			},
		},
		created_at: { type: 'string', format: 'date-time', nullable: true },
		updated_at: { type: 'string', format: 'date-time', nullable: true },
	},
};

const studySessionSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		user_id: { type: 'string' },
		subject_id: { type: 'string', nullable: true },
		started_at: { type: 'string', format: 'date-time' },
		ended_at: { type: 'string', format: 'date-time' },
		duration_minutes: { type: 'number', nullable: true },
		questions_answered: { type: 'integer', nullable: true },
		depth: { type: 'string', nullable: true },
		notes: { type: 'string', nullable: true },
		metadata: { type: 'object', additionalProperties: true },
		created_at: { type: 'string', format: 'date-time', nullable: true },
	},
};

const schemas = {
	Error: commonErrorSchema,
	AuthSignupInput: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 6 },
			full_name: { type: 'string' },
			current_mode: { type: 'string', enum: ['university', 'competitive'] },
		},
		additionalProperties: true,
	},
	AuthLoginInput: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string', format: 'email' },
			password: { type: 'string' },
		},
	},
	ResetPasswordInput: {
		type: 'object',
		required: ['email'],
		properties: {
			email: { type: 'string', format: 'email' },
		},
	},
	UpdateMeInput: {
		type: 'object',
		properties: {
			current_mode: { type: 'string', enum: ['university', 'competitive'] },
		},
	},
	SubjectInput: {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string' },
			professor: { type: 'string' },
			room: { type: 'string' },
			color: { type: 'string' },
			code: { type: 'string' },
			mode: { type: 'string', enum: ['university', 'competitive'] },
			metadata: { type: 'object', additionalProperties: true },
			is_active: { type: 'boolean' },
		},
	},
	TaskInput: {
		type: 'object',
		required: ['title', 'due_date'],
		properties: {
			title: { type: 'string' },
			description: { type: 'string' },
			due_date: { type: 'string', format: 'date-time' },
			subject_id: { type: 'string' },
			type: { type: 'string' },
			status: { type: 'string' },
			priority: { type: 'integer' },
			estimated_minutes: { type: 'number' },
			recurrence: { type: 'string' },
			tags: { type: 'array', items: { type: 'string' } },
			metadata: { type: 'object', additionalProperties: true },
		},
	},
	SessionInput: {
		type: 'object',
		required: ['started_at', 'ended_at'],
		properties: {
			started_at: { type: 'string', format: 'date-time' },
			ended_at: { type: 'string', format: 'date-time' },
			subject_id: { type: 'string' },
			questions_answered: { type: 'integer' },
			depth: { type: 'string' },
			notes: { type: 'string' },
			metadata: { type: 'object', additionalProperties: true },
		},
	},
	AuthResponse: authResponseSchema,
	SubjectResponse: subjectSchema,
	TaskResponse: taskSchema,
	SessionResponse: studySessionSchema,
};

const paths = {
	'/health': {
		get: {
			tags: ['System'],
			summary: 'Verifica a saúde do backend',
			responses: {
				200: {
					description: 'Backend saudável',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: { status: { type: 'string', example: 'ok' } },
							},
						},
					},
				},
			},
		},
	},
	'/api': {
		get: {
			tags: ['System'],
			summary: 'Retorna a raiz da API',
			responses: {
				200: {
					description: 'Mensagem de boas-vindas',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: { message: { type: 'string' } },
							},
						},
					},
				},
			},
		},
	},
	'/api/v1': {
		get: {
			tags: ['System'],
			summary: 'Retorna a versão da API',
			responses: {
				200: {
					description: 'Versão atual',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: { version: { type: 'string', example: 'v1' } },
							},
						},
					},
				},
			},
		},
	},
	'/api/v1/auth/signup': {
		post: {
			tags: ['Auth'],
			summary: 'Cria uma conta de usuário',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AuthSignupInput' },
					},
				},
			},
			responses: {
				201: {
					description: 'Usuário criado',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
				},
				400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/auth/login': {
		post: {
			tags: ['Auth'],
			summary: 'Autentica o usuário',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AuthLoginInput' },
					},
				},
			},
			responses: {
				200: {
					description: 'Sessão criada',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
				},
				401: { description: 'Falha de autenticação', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/auth/logout': {
		post: {
			tags: ['Auth'],
			summary: 'Encerra a sessão atual',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Logout realizado',
					content: {
						'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } },
					},
				},
				401: { description: 'Token ausente ou inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/auth/reset-password': {
		post: {
			tags: ['Auth'],
			summary: 'Solicita redefinição de senha',
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordInput' } } },
			},
			responses: {
				200: {
					description: 'Solicitação enviada',
					content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } },
				},
				400: { description: 'Email obrigatório ou inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/auth/validate-session': {
		get: {
			tags: ['Auth'],
			summary: 'Valida a sessão atual',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Sessão válida',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
				},
				401: { description: 'Sessão inválida', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/auth/me': {
		get: {
			tags: ['Auth'],
			summary: 'Retorna o usuário autenticado',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Perfil autenticado',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
				},
				401: { description: 'Token ausente ou inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
		patch: {
			tags: ['Auth'],
			summary: 'Atualiza o perfil do usuário autenticado',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMeInput' } } },
			},
			responses: {
				200: {
					description: 'Perfil atualizado',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
				},
				400: { description: 'Payload inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				401: { description: 'Token ausente ou inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/subjects': {
		get: {
			tags: ['Subjects'],
			summary: 'Lista as disciplinas do usuário',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'mode', in: 'query', schema: { type: 'string', enum: ['university', 'competitive'] }, required: false }],
			responses: {
				200: {
					description: 'Lista de disciplinas',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/SubjectResponse' } } } } } },
				},
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
		post: {
			tags: ['Subjects'],
			summary: 'Cria uma disciplina',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/SubjectInput' } } },
			},
			responses: {
				201: {
					description: 'Disciplina criada',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/SubjectResponse' } } } } },
				},
				400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/subjects/{subjectId}': {
		patch: {
			tags: ['Subjects'],
			summary: 'Atualiza uma disciplina',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'subjectId', in: 'path', required: true, schema: { type: 'string' } }],
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/SubjectInput' } } },
			},
			responses: {
				200: {
					description: 'Disciplina atualizada',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/SubjectResponse' } } } } },
				},
				404: { description: 'Disciplina não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
		delete: {
			tags: ['Subjects'],
			summary: 'Remove uma disciplina',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'subjectId', in: 'path', required: true, schema: { type: 'string' } }],
			responses: {
				200: {
					description: 'Disciplina removida',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { deleted: { type: 'boolean' } } } } } } },
				},
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/tasks': {
		get: {
			tags: ['Tasks'],
			summary: 'Lista as tarefas do usuário',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Lista de tarefas',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/TaskResponse' } } } } } },
				},
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
		post: {
			tags: ['Tasks'],
			summary: 'Cria uma tarefa',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } },
			},
			responses: {
				201: {
					description: 'Tarefa criada',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/TaskResponse' } } } } },
				},
				400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/tasks/{taskId}': {
		patch: {
			tags: ['Tasks'],
			summary: 'Atualiza uma tarefa',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } },
			},
			responses: {
				200: {
					description: 'Tarefa atualizada',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/TaskResponse' } } } } },
				},
				404: { description: 'Tarefa não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
		delete: {
			tags: ['Tasks'],
			summary: 'Remove uma tarefa',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
			responses: {
				200: {
					description: 'Tarefa removida',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { deleted: { type: 'boolean' } } } } } } },
				},
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
	'/api/v1/sessions': {
		get: {
			tags: ['Sessions'],
			summary: 'Lista sessões de estudo',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Lista de sessões',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/SessionResponse' } } } } } },
				},
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
		post: {
			tags: ['Sessions'],
			summary: 'Cria uma sessão de estudo',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionInput' } } },
			},
			responses: {
				201: {
					description: 'Sessão criada',
					content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/SessionResponse' } } } } },
				},
				400: { description: 'Datas inválidas ou ausentes', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
			},
		},
	},
};

const openapiDocument = {
	openapi: '3.0.3',
	info: {
		title: 'StudySync API',
		description: 'Documentação OpenAPI do backend StudySync. A API usa autenticação Bearer e também aceita o cookie HttpOnly access_token em navegação web.',
		version: '1.0.0',
	},
	servers: [{ url: apiServerUrl }],
	tags: [
		{ name: 'System', description: 'Rotas de saúde e verificação' },
		{ name: 'Auth', description: 'Autenticação e sessão' },
		{ name: 'Subjects', description: 'Disciplinas do usuário' },
		{ name: 'Tasks', description: 'Tarefas do usuário' },
		{ name: 'Sessions', description: 'Sessões de estudo' },
	],
	paths,
	components: {
		securitySchemes: { bearerAuth },
		schemas,
	},
	security: [{ bearerAuth: [] }],
};

export default openapiDocument;