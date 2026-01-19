# Avatar Chat Backend

실시간 음성 기반 AI 아바타 채팅 시스템의 백엔드 서버입니다. WebSocket을 통해 사용자의 음성을 수신하고, STT/LLM/TTS 파이프라인을 거쳐 AI 응답 음성과 Viseme(입모양 동기화 데이터)를 스트리밍으로 전송합니다.

## 주요 목표

1. **응답 지연 최소화** - End-to-End 약 1.1s ~ 3.3s (평균 2.2s)
2. **대화의 자연스러움** - RAG 기반 컨텍스트 윈도우 관리 및 벡터 검색
3. **음성과 입모양 동기화** - Viseme 데이터를 통한 정확한 립싱크

## 아키텍처

```
Client ─────────────────────────────────────────── Vendor APIs
   │                                                    │
   │  pcm (16kHz)         Edge Cluster                  │
   │ ──────────────►  ┌─────────────────┐               │
   │                  │     Server      │ ─────────────►│
   │ ◄──────────────  │   (Fastify)     │               │
   │  pcm, viseme     │                 │ ◄─────────────│
   │                  │  Redis Vector   │               │
   │                  │      DB         │      STT (Azure Speech)
   │                  └─────────────────┘      LLM (Azure OpenAI)
   │                                           Embedding (Azure OpenAI)
   │                                           TTS (AWS Polly)
```

### Speech Pipeline

```
WebSocket → AudioPreprocess → STT → Context/RAG → TTS → WebSocket
                 │              │         │         │
              버퍼링         발화인식    LLM응답    음성합성
              다운샘플링     텍스트변환  벡터검색   Viseme생성
```

### 주요 기능 상세

#### 지연 최적화

1. **이벤트 기반 비동기 파이프라인** - 각 스테이지가 이벤트로 연결되어 병렬 처리
2. **스트리밍 응답** - LLM 토큰 단위 수신 → 문장 단위로 TTS 요청
3. **병렬 프리패치** - 다음 시퀀스 TTS 요청을 현재 시퀀스 전송과 병렬 처리
4. **첫 문장 길이 제한** - 프롬프트로 첫 응답을 12자 이내로 제한하여 초기 응답 속도 향상

#### 대화 컨텍스트 관리

1. **Context Window** - 최근 대화를 메모리에 유지하여 LLM에 전달
2. **Context Snapshot** - 연속 발화 시 이벤트 순서 보장
3. **RAG (Vector Search)** - 윈도우 범위 밖 과거 대화를 벡터 유사도로 검색
4. **Redis Vector Index** - HNSW 알고리즘 기반 빠른 KNN 검색

#### 발화 감지

- Azure Speech의 `speechStartDetected` 이벤트로 사용자 발화 시작 감지
- 감지 시 현재 AI 응답 생성/전송 중단

## 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Node.js + TypeScript |
| Framework | Fastify 5 |
| Communication | WebSocket (@fastify/websocket) |
| Database | Redis Stack (Vector Search) |
| STT | Azure Speech Service |
| LLM | Azure OpenAI (Realtime API) |
| Embedding | Azure OpenAI |
| TTS | AWS Polly |

## 프로젝트 구조

```
src/
├── adapters/           # 외부 벤더 API 어댑터
│   ├── embedding/      # Azure OpenAI Embedding
│   ├── llm/            # Azure OpenAI LLM
│   ├── stt/            # Azure Speech STT
│   └── tts/            # AWS Polly TTS
├── constants/          # 상수 정의
├── entities/           # 엔티티 정의
├── plugins/            # Fastify 플러그인
├── repositories/       # 데이터 접근 계층
├── routes/             # API 라우트
│   └── api/
│       ├── http/       # REST API
│       └── ws/         # WebSocket
├── schemas/            # 스키마 정의
├── services/           # 비즈니스 로직
│   └── chatting/
│       ├── chatting.service.ts
│       ├── chatting.factory.ts
│       └── speech-pipeline/
│           ├── orchestrator.ts
│           ├── audio-preprocess/
│           ├── speech-to-text/
│           ├── context-rag/
│           └── text-to-speech/
└── utils/
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 10+
- Docker (Redis용)

### 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 필요한 값을 입력합니다:

```bash
cp .env.example .env
```

```env
NODE_ENV=development

# Server
FASTIFY_CLOSE_GRACE_DELAY=1000
LOG_LEVEL=debug

# Security
RATE_LIMIT_MAX=100

# Azure Speech Service (STT)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=koreacentral

# Azure OpenAI Service (LLM, Embedding)
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_LLM_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_EMBEDDING_ENDPOINT=https://your-resource.openai.azure.com

# AWS Polly (TTS)
AWS_POLLY_KEY=your_aws_access_key
AWS_POLLY_SECRET=your_aws_secret_key
AWS_POLLY_REGION=ap-northeast-2
```

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# Redis 실행
docker compose up -d

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드 및 실행
pnpm build
pnpm start
```

## API 엔드포인트

### WebSocket

- `ws://localhost:3000/api/chat` - 실시간 음성 채팅

#### 클라이언트 → 서버
| 타입 | 설명 |
|------|------|
| Binary (Int16Array) | PCM 오디오 데이터 (16kHz, mono, 16-bit) |

#### 서버 → 클라이언트
| 타입 | 메시지 | 설명 |
|------|--------|------|
| JSON | `session_id` | 세션 ID 발급 |
| JSON | `speech_detected` | 사용자 발화 감지 |
| JSON | `utterance_start` | AI 응답 시작 |
| JSON | `viseme` | 입모양 동기화 데이터 |
| JSON | `end` | 시퀀스 종료 |
| Binary | PCM | AI 음성 데이터 |

### REST API

- `GET /api/messages?sessionId={id}` - 세션별 대화 기록 조회

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 (hot reload) |
| `pnpm build` | TypeScript 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm standalone` | 독립 실행 모드 |
| `pnpm lint` | ESLint 검사 |
| `pnpm lint:fix` | ESLint 자동 수정 |
| `pnpm test` | 테스트 실행 |

## 라이선스

MIT License
