from __future__ import annotations

from datetime import date, time
import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .body_energy import build_body_energy_profile
from .being_state import Activation, ActivationEngine, BeingStateSpace, Coordinate, DIMENSIONS, reaction_flux
from .bodygraph import render_bodygraph_svg
from .contact_loop import ContactLoop, GrammarController
from .deep_synthesis import build_deep_synthesis_profile
from .dimensional import DimensionalOntology, PerspectiveEngine
from .engine import calculate_chart
from .geonatal import GeonatalRuntimeError, calculate_geonatal
from .input import InputNormalizationError, normalize_birth_input
from .interpretation_maps import build_interpretation_map, map_context_text, map_type_from_focus
from .language_contact import Autoling, Diseminer, SemanticGraph
from .labels import (
    CENTER_LABELS,
    display_authority,
    display_channel_label,
    display_definition,
    display_gate_theme,
    display_incarnation_cross,
    display_not_self,
    display_profile,
    display_signature,
    display_strategy,
    display_type,
    normalize_center_title,
)
from .product import build_llm_product
from .providers import (
    DeepSeekClient,
    MiniMaxImageClient,
    ProviderConfigurationError,
    ProviderError,
    external_provider_status,
)
from .shared_cognition import SynthiaCognitiveRuntime
from .validated_learning import ValidatedLearningStore
from .version import VERSION
from .web_models import (
    BirthProfile,
    ChatMessage,
    ChatSession,
    GeneratedVisual,
    ReportPackage,
    SavedChart,
    utc_now_iso,
)


REPORT_CONFIG = {
    "overview": {
        "focus": "overview",
        "depth": "standard",
        "question": "请给我一份完整但清晰的人类图总览。",
    },
    "body-energy": {
        "focus": "growth",
        "depth": "deep",
        "question": "请重点解读我的身体资源、九大中心、通道、闸门和能量卡点。",
    },
    "career": {
        "focus": "career",
        "depth": "deep",
        "question": "我最适合怎么工作、赚钱、选方向？",
    },
    "talent": {
        "focus": "talent",
        "depth": "deep",
        "question": "请深挖我的天赋、主航道、资源配置方式和容易误用的消耗链。",
    },
    "relationship": {
        "focus": "relationship",
        "depth": "deep",
        "question": "请解读我在关系里的连接方式、边界、情绪和沟通模式。",
    },
    "deep": {
        "focus": "talent",
        "depth": "deep",
        "question": "请给我一份可长期阅读的人类图深度解读。",
    },
}


class GeonatalRequest(BaseModel):
    timestamp: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class ChartCreateRequest(BaseModel):
    user_name: str | None = Field(default=None, max_length=80)
    gender: str | None = Field(default=None, max_length=20)
    birth_date: str = Field(description="YYYY-MM-DD")
    birth_time: str | None = Field(default=None, description="HH:MM or HH:MM:SS")
    city: str | None = None
    region: str | None = None
    country: str | None = None
    timezone_name: str | None = Field(default=None, description="IANA timezone")


class ReportRequest(BaseModel):
    chart_id: str
    report_type: str = "overview"
    depth: str | None = None
    question: str | None = None


class ChatRequest(BaseModel):
    chart_id: str
    question: str = Field(min_length=1)
    session_id: str | None = None
    focus: str | None = None
    depth: str = "deep"
    map_type: str | None = None
    map_item_key: str | None = None
    question_id: str | None = None
    entry_source: str | None = None
    synthesis_mode: str | None = None


class InterpretationMapRequest(BaseModel):
    chart_id: str
    map_type: str = "talent"
    depth: str = "deep"


class ImageGenerationRequest(BaseModel):
    chart_id: str
    prompt: str | None = Field(default=None, max_length=1200)
    aspect_ratio: str = Field(default="3:4", max_length=12)


class PerspectiveLocateRequest(BaseModel):
    expressions: dict[str, str]
    weights: dict[str, float] = Field(default_factory=dict)


class PerspectiveClarifyRequest(PerspectiveLocateRequest):
    dimension: str


class EmergenceRequest(BaseModel):
    present_identity: str
    contributing_primitives: list[str]
    parent_states: list[str] = Field(default_factory=list)
    inherited_relations: list[str] = Field(default_factory=list)
    transformation_path: list[str] = Field(default_factory=list)
    changed_proportions: dict[str, float] = Field(default_factory=dict)
    contact_event: str
    emergence_time: str | None = None
    recognition_time: str | None = None


class RelationLearningRequest(BaseModel):
    text: str = Field(min_length=1)
    source_ref: str = Field(min_length=1)
    dimension_weights: dict[str, float] = Field(default_factory=dict)


class ProbeRequest(BaseModel):
    proportions: dict[str, float]
    expressions: dict[str, str] = Field(default_factory=dict)
    prior_questions: list[str] = Field(default_factory=list)


class GrammarAnalyzeRequest(BaseModel):
    text: str = Field(min_length=1)


class ContactStartRequest(BaseModel):
    text: str = Field(min_length=1)
    source_ref: str = "contact"


class ContactObserveRequest(ContactStartRequest):
    pass


class ContactClarifyRequest(BaseModel):
    dimension: str


class StateCoordinateRequest(BaseModel):
    planetary: int; dimension: int; gate: int; line: int; color: int; tone: int
    base: int; degree: int; minute: int; second: int; arc: int; zodiac: int; house: int


class ActivationInput(BaseModel):
    gate: int
    source: str
    coordinate: StateCoordinateRequest | None = None


class FieldEvaluateRequest(BaseModel):
    natal_gates: list[int]
    transits: list[ActivationInput] = Field(default_factory=list)
    contacts: list[ActivationInput] = Field(default_factory=list)
    previous_space_generation: int = 0


class CognitiveReadRequest(BaseModel):
    text: str = Field(min_length=1)
    source_ref: str = Field(min_length=1)
    source_kind: str = "book"
    language: str = "auto"
    page: int | None = None


class CognitiveQuestionRequest(BaseModel):
    question: str = Field(min_length=1)


class CognitiveReportRequest(BaseModel):
    topic: str = Field(min_length=1)


class CognitiveProofreadRequest(BaseModel):
    text: str = Field(min_length=1)
    language: str = "auto"
    mode: str = "generated"


class ValidatedIngestRequest(BaseModel):
    source_id: str = Field(min_length=1)
    page: int = Field(ge=0)
    text: str = Field(min_length=1)


class ValidatedClaimRequest(BaseModel):
    topic: str = Field(min_length=1)
    limit: int = Field(default=20, ge=1, le=100)


class NormalizationCorrectionRequest(BaseModel):
    corrected_text: str = Field(min_length=1)


class HumanDesignWebStore:
    def __init__(self) -> None:
        self.charts: dict[str, SavedChart] = {}
        self.reports: dict[str, ReportPackage] = {}
        self.sessions: dict[str, ChatSession] = {}
        self.visuals: dict[str, GeneratedVisual] = {}

    def save_chart(self, chart: SavedChart) -> None:
        self.charts[chart.chart_id] = chart

    def get_chart(self, chart_id: str) -> SavedChart:
        chart = self.charts.get(chart_id)
        if chart is None:
            raise HTTPException(status_code=404, detail={"code": "chart_not_found", "message": "没有找到这张人类图。"})
        return chart

    def save_report(self, report: ReportPackage) -> None:
        self.reports[report.report_id] = report

    def get_session(self, session_id: str | None, chart_id: str, focus: str) -> ChatSession:
        next_session_id = session_id
        if session_id and session_id in self.sessions:
            session = self.sessions[session_id]
            if session.chart_id == chart_id:
                return session
            next_session_id = None
        now = utc_now_iso()
        return ChatSession(
            session_id=next_session_id or f"session_{uuid4().hex}",
            chart_id=chart_id,
            focus=focus,
            messages=(),
            created_at_utc=now,
            updated_at_utc=now,
        )

    def save_session(self, session: ChatSession) -> None:
        self.sessions[session.session_id] = session

    def save_visual(self, visual: GeneratedVisual) -> None:
        self.visuals[visual.image_id] = visual


def create_app(
    store: HumanDesignWebStore | None = None,
    semantic_graph: SemanticGraph | None = None,
) -> FastAPI:
    active_store = store or HumanDesignWebStore()
    dimensional_ontology = DimensionalOntology.load_default()
    perspective_engine = PerspectiveEngine(dimensional_ontology)
    shared_graph = semantic_graph or SemanticGraph()
    diseminer = Diseminer(shared_graph)
    autoling = Autoling()
    grammar_controller = GrammarController()
    contact_loop = ContactLoop(
        shared_graph,
        grammar=grammar_controller,
        perspective=perspective_engine,
    )
    being_state_space = BeingStateSpace()
    activation_engine = ActivationEngine()
    cognitive_db = Path(
        os.getenv(
            "SYNTHIA_COGNITIVE_DB",
            str(Path.cwd() / "data" / "synthia-cognitive-network.sqlite3"),
        )
    )
    cognitive_db.parent.mkdir(parents=True, exist_ok=True)
    cognitive_runtime = SynthiaCognitiveRuntime(cognitive_db)
    validated_db = cognitive_db.with_name("synthia-validated-learning.sqlite3")
    validated_learning = ValidatedLearningStore(validated_db)
    app = FastAPI(
        title="Human Design Web/App API",
        version=VERSION,
        description="简体中文人类图 Web/App 产品 API：排盘、出图、报告、问答。",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "product": "human-design-web-app"}

    @app.post("/api/geonatal")
    def geonatal(request: GeonatalRequest) -> dict[str, Any]:
        try:
            return calculate_geonatal(
                request.timestamp,
                latitude=request.latitude,
                longitude=request.longitude,
            )
        except GeonatalRuntimeError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "geonatal_runtime_error", "message": str(exc)},
            ) from exc

    @app.get("/api/product/config")
    def product_config() -> dict[str, Any]:
        return {
            "product_version": f"V{VERSION.rsplit('.', 1)[0]}",
            "api_version": VERSION,
            "report_types": list(REPORT_CONFIG),
            "map_types": ["body", "wealth", "talent", "relationship", "mission", "professional"],
            "required_birth_fields": ["birth_date", "birth_time", "city/region"],
            "precision_policy": "birthday_only_is_guidance_not_formal_chart",
            "terminology": {
                "sacral": "荐骨中心",
                "ajna": "阿姬娜中心",
                "throat": "喉咙中心",
            },
        }

    @app.get("/api/product/providers")
    def product_providers() -> dict[str, Any]:
        return external_provider_status()

    @app.get("/api/dimensions")
    def dimensions() -> dict[str, Any]:
        return dimensional_ontology.to_dict()

    @app.post("/api/perspective/locate")
    def locate_perspective(request: PerspectiveLocateRequest) -> dict[str, Any]:
        try:
            return perspective_engine.locate(request.expressions, request.weights).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "perspective_invalid", "message": str(exc)},
            ) from exc

    @app.post("/api/perspective/clarify")
    def clarify_perspective(request: PerspectiveClarifyRequest) -> dict[str, Any]:
        try:
            probable = perspective_engine.locate(request.expressions, request.weights)
            return perspective_engine.clarify(probable, request.dimension).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "clarity_invalid", "message": str(exc)},
            ) from exc

    @app.post("/api/emergences")
    def create_emergence(request: EmergenceRequest) -> dict[str, Any]:
        try:
            return perspective_engine.emerge(**request.model_dump()).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "emergence_invalid", "message": str(exc)},
            ) from exc

    @app.post("/api/language-contact/learn")
    def learn_relations(request: RelationLearningRequest) -> dict[str, Any]:
        try:
            return diseminer.learn(
                request.text,
                source_ref=request.source_ref,
                dimension_weights=request.dimension_weights,
            ).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "learning_invalid", "message": str(exc)},
            ) from exc

    @app.post("/api/language-contact/probe")
    def suggest_probe(request: ProbeRequest) -> dict[str, Any]:
        return autoling.suggest(
            proportions=request.proportions,
            expressions=request.expressions,
            prior_questions=request.prior_questions,
        ).to_dict()

    @app.post("/api/language-contact/grammar/analyze")
    def analyze_grammar(request: GrammarAnalyzeRequest) -> dict[str, Any]:
        return grammar_controller.analyze(request.text).to_dict()

    @app.post("/api/language-contact/sessions")
    def start_contact(request: ContactStartRequest) -> dict[str, Any]:
        try:
            return contact_loop.start(
                request.text, source_ref=request.source_ref
            ).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "contact_invalid", "message": str(exc)},
            ) from exc

    @app.get("/api/language-contact/sessions/{session_id}")
    def get_contact(session_id: str) -> dict[str, Any]:
        try:
            return contact_loop.get(session_id).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=404,
                detail={"code": "contact_not_found", "message": str(exc)},
            ) from exc

    @app.post("/api/language-contact/sessions/{session_id}/observations")
    def observe_contact(
        session_id: str, request: ContactObserveRequest
    ) -> dict[str, Any]:
        try:
            return contact_loop.observe(
                session_id, request.text, source_ref=request.source_ref
            ).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "contact_invalid", "message": str(exc)},
            ) from exc

    @app.post("/api/language-contact/sessions/{session_id}/clarity")
    def clarify_contact(
        session_id: str, request: ContactClarifyRequest
    ) -> dict[str, Any]:
        try:
            return contact_loop.clarify(session_id, request.dimension).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "clarity_invalid", "message": str(exc)},
            ) from exc

    @app.get("/api/being-state-space")
    def being_state_space_info() -> dict[str, Any]:
        return {
            "dimensions": list(DIMENSIONS),
            "axes": [
                {"name": name, "minimum": low, "maximum": high}
                for name, low, high in being_state_space.axes
            ],
            "size": being_state_space.size(),
        }

    @app.post("/api/being-state-space/encode")
    def encode_being_coordinate(request: StateCoordinateRequest) -> dict[str, Any]:
        try:
            coordinate = Coordinate(**request.model_dump())
            return {"index": being_state_space.encode(coordinate), "coordinate": coordinate.to_dict()}
        except ValueError as exc:
            raise HTTPException(status_code=422, detail={"code": "coordinate_invalid", "message": str(exc)}) from exc

    @app.post("/api/being-state-space/evaluate")
    def evaluate_being_state(request: FieldEvaluateRequest) -> dict[str, Any]:
        try:
            def activation(item: ActivationInput) -> Activation:
                coordinate = Coordinate(**item.coordinate.model_dump()) if item.coordinate else None
                return Activation(item.gate, item.source, coordinate)
            state = activation_engine.evaluate(
                request.natal_gates,
                [activation(item) for item in request.transits],
                [activation(item) for item in request.contacts],
                request.previous_space_generation,
            )
            return {"state": state.to_dict(), "reaction_flux": reaction_flux(state)}
        except ValueError as exc:
            raise HTTPException(status_code=422, detail={"code": "field_state_invalid", "message": str(exc)}) from exc

    @app.post("/api/cognition/read")
    def cognitive_read(request: CognitiveReadRequest) -> dict[str, Any]:
        return cognitive_runtime.autoling.read(
            request.text,
            source_ref=request.source_ref,
            source_kind=request.source_kind,
            language=request.language,
            page=request.page,
        ).to_dict()

    @app.post("/api/cognition/research")
    def cognitive_research(request: CognitiveReadRequest) -> dict[str, Any]:
        return cognitive_runtime.diseminer.research(
            request.text,
            source_ref=request.source_ref,
            language=request.language,
        ).to_dict()

    @app.post("/api/cognition/chat")
    def cognitive_chat(request: CognitiveQuestionRequest) -> dict[str, Any]:
        return cognitive_runtime.chat(request.question).to_dict()

    @app.post("/api/cognition/reports")
    def cognitive_report(request: CognitiveReportRequest) -> dict[str, Any]:
        return cognitive_runtime.write_report(request.topic).to_dict()

    @app.post("/api/cognition/proofread")
    def cognitive_proofread(request: CognitiveProofreadRequest) -> dict[str, Any]:
        if request.mode not in {"source", "generated"}:
            raise HTTPException(
                status_code=422,
                detail={"code": "proofread_mode_invalid", "message": "mode must be source or generated"},
            )
        return cognitive_runtime.autoling.proofread(
            request.text,
            language=request.language,
            mode=request.mode,
        ).to_dict()

    @app.get("/api/learning/status")
    def validated_learning_status() -> dict[str, Any]:
        return validated_learning.status()

    @app.post("/api/learning/ingest")
    def validated_learning_ingest(request: ValidatedIngestRequest) -> dict[str, Any]:
        observation_id = validated_learning.ingest(request.source_id, request.page, request.text)
        normalization_id = validated_learning.normalize(observation_id)
        relation_ids = validated_learning.extract_and_validate(normalization_id)
        relations = [
            dict(validated_learning.connection.execute(
                "SELECT * FROM relations WHERE relation_id=?", (relation_id,)
            ).fetchone())
            for relation_id in relation_ids
        ]
        # Approved corrected knowledge is then propagated to the shared organs.
        approved_text = " ".join(
            f"{row['subject']} {row['predicate']} {row['object']}"
            for row in relations if row["validation_status"] == "approved"
        )
        if approved_text:
            cognitive_runtime.diseminer.research(
                approved_text, source_ref=f"validated:{request.source_id}", language="auto"
            )
        return {
            "observation_id": observation_id,
            "normalization_id": normalization_id,
            "relations": relations,
            "status": validated_learning.status(),
        }

    @app.post("/api/learning/claims")
    def validated_learning_claims(request: ValidatedClaimRequest) -> dict[str, Any]:
        claim_ids = validated_learning.write_claims(request.topic, request.limit)
        return {
            "claims": [
                {
                    "claim_id": claim_id,
                    "trace": validated_learning.trace_claim(claim_id),
                }
                for claim_id in claim_ids
            ]
        }

    @app.get("/api/learning/claims/{claim_id}/trace")
    def validated_learning_trace(claim_id: str) -> dict[str, Any]:
        trace = validated_learning.trace_claim(claim_id)
        if not trace:
            raise HTTPException(status_code=404, detail={"code": "claim_not_found"})
        return {"claim_id": claim_id, "trace": trace}

    @app.post("/api/learning/normalizations/{normalization_id}/correct")
    def validated_learning_correct(
        normalization_id: str, request: NormalizationCorrectionRequest
    ) -> dict[str, Any]:
        try:
            correction_id = validated_learning.correct_normalization(
                normalization_id, request.corrected_text
            )
        except (ValueError, TypeError) as exc:
            raise HTTPException(status_code=404, detail={"code": "normalization_not_found"}) from exc
        cognitive_runtime.diseminer.research(
            request.corrected_text, source_ref=f"correction:{correction_id}", language="auto"
        )
        return {"correction_id": correction_id, "status": validated_learning.status()}

    @app.post("/api/learning/corrections/{correction_id}/rollback")
    def validated_learning_rollback(correction_id: str) -> dict[str, Any]:
        try:
            validated_learning.rollback(correction_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail={"code": "correction_not_found"}) from exc
        return {"correction_id": correction_id, "rolled_back": True, "status": validated_learning.status()}

    @app.post("/api/charts")
    def create_chart(request: ChartCreateRequest) -> dict[str, Any]:
        birth_datetime = _compose_birth_datetime(request.birth_date, request.birth_time)
        if not request.timezone_name and not any((request.city, request.region, request.country)):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "timezone_or_location_required",
                    "message": "正式人类图需要出生时间和出生地。仅生日只能做低精度引导，不能生成正式 BodyGraph。",
                    "required_fields": ["birth_time", "city/region"],
                },
            )
        try:
            normalized = normalize_birth_input(
                birth_datetime,
                timezone_name=request.timezone_name,
                city=request.city,
                region=request.region,
                country=request.country,
            )
            chart = calculate_chart(normalized)
        except (InputNormalizationError, ValueError) as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "birth_input_invalid", "message": str(exc)},
            ) from exc

        chart_id = f"chart_{uuid4().hex}"
        title = request.user_name or "我的人类图"
        svg = render_bodygraph_svg(chart, title=title)
        bodygraph_url = f"/api/charts/{chart_id}/bodygraph.svg"
        saved = SavedChart(
            chart_id=chart_id,
            user_name=request.user_name,
            birth_profile=BirthProfile(
                birth_date=request.birth_date,
                birth_time=request.birth_time,
                gender=request.gender,
                city=request.city,
                region=request.region,
                country=request.country,
                timezone_name=request.timezone_name,
            ),
            chart=chart,
            bodygraph_svg_url=bodygraph_url,
            bodygraph_svg=svg,
            created_at_utc=utc_now_iso(),
        )
        active_store.save_chart(saved)
        payload = saved.to_dict(include_svg=True)
        payload["precision_warnings"] = list(chart.input.warnings)
        payload["display_summary"] = _display_summary(chart)
        return payload

    @app.get("/api/charts/{chart_id}")
    def get_chart(chart_id: str) -> dict[str, Any]:
        chart = active_store.get_chart(chart_id)
        payload = chart.to_dict(include_svg=False)
        payload["precision_warnings"] = list(chart.chart.input.warnings)
        payload["display_summary"] = _display_summary(chart.chart)
        return payload

    @app.get("/api/charts/{chart_id}/bodygraph.svg")
    def get_bodygraph_svg(chart_id: str) -> Response:
        chart = active_store.get_chart(chart_id)
        return Response(content=chart.bodygraph_svg, media_type="image/svg+xml")

    @app.post("/api/reports")
    def create_report(request: ReportRequest) -> dict[str, Any]:
        saved_chart = active_store.get_chart(request.chart_id)
        config = _report_config(request.report_type)
        focus = config["focus"]
        depth = request.depth or config["depth"]
        question = request.question or config["question"]
        package = build_llm_product(
            saved_chart.chart,
            focus=focus,
            question=question,
            citation_mode="none",
            depth=depth,
        )
        body_energy = (
            build_body_energy_profile(saved_chart.chart).to_dict()
            if request.report_type in {"body-energy", "deep", "talent"}
            else None
        )
        deep_synthesis = (
            build_deep_synthesis_profile(saved_chart.chart, focus=focus, question=question).to_dict()
            if request.report_type in {"talent", "deep", "career"} or depth == "deep"
            else None
        )
        export_markdown = _compose_export_markdown(package.answer_markdown, body_energy, deep_synthesis)
        report = ReportPackage(
            report_id=f"report_{uuid4().hex}",
            chart_id=request.chart_id,
            report_type=request.report_type,
            focus=focus,
            depth=depth,
            package=package,
            body_energy=body_energy,
            deep_synthesis=deep_synthesis,
            export_markdown=export_markdown,
            created_at_utc=utc_now_iso(),
        )
        active_store.save_report(report)
        return report.to_dict()

    @app.post("/api/interpretation-maps")
    def create_interpretation_map(request: InterpretationMapRequest) -> dict[str, Any]:
        saved_chart = active_store.get_chart(request.chart_id)
        package = build_interpretation_map(
            saved_chart.chart,
            map_type=request.map_type,
            depth=request.depth,
            chart_id=request.chart_id,
        )
        return package.to_dict()

    @app.post("/api/chat")
    def chat(request: ChatRequest) -> dict[str, Any]:
        saved_chart = active_store.get_chart(request.chart_id)
        focus = request.focus or _infer_focus(request.question)
        map_package = build_interpretation_map(
            saved_chart.chart,
            map_type=request.map_type or map_type_from_focus(focus),
            depth=request.depth,
            chart_id=request.chart_id,
        )
        package = build_llm_product(
            saved_chart.chart,
            focus=focus,
            question=request.question,
            citation_mode="none",
            depth=request.depth,
        )
        session = active_store.get_session(request.session_id, request.chart_id, focus)
        answer_markdown, answer_provider, answer_model, provider_configured = _generate_chat_answer(
            saved_chart=saved_chart,
            package=package,
            map_package=map_package,
            session=session,
            question=request.question,
            map_item_key=request.map_item_key,
            cognitive_runtime=cognitive_runtime,
        )
        user_message = ChatMessage(
            role="user",
            content=request.question,
            created_at_utc=utc_now_iso(),
        )
        assistant_message = ChatMessage(
            role="assistant",
            content=answer_markdown,
            citations=tuple(citation.to_dict() for citation in package.answer_citations),
            created_at_utc=utc_now_iso(),
        )
        session = session.append(user_message, assistant_message, focus=focus)
        active_store.save_session(session)
        return {
            "session_id": session.session_id,
            "chart_id": request.chart_id,
            "focus": focus,
            "answer_markdown": answer_markdown,
            "answer_provider": answer_provider,
            "answer_model": answer_model,
            "provider_configured": provider_configured,
            "entry_source": request.entry_source,
            "synthesis_mode": request.synthesis_mode,
            "citations": [citation.to_dict() for citation in package.answer_citations],
            "map_context": {
                "map_type": map_package.map_type,
                "title": map_package.title,
                "sections": [section.to_dict() for section in map_package.sections],
                "retrieved_knowledge": [atom.to_dict() for atom in map_package.retrieved_knowledge],
            },
            "suggested_followups": list(package.suggested_followups),
            "session": session.to_dict(),
        }

    @app.post("/api/images/reading-visual")
    def create_reading_visual(request: ImageGenerationRequest) -> dict[str, Any]:
        saved_chart = active_store.get_chart(request.chart_id)
        prompt = _build_visual_prompt(saved_chart, request.prompt)
        config = external_provider_status()["minimax"]
        if not config["configured"]:
            visual = _fallback_visual(saved_chart, prompt, config, provider_configured=False)
            active_store.save_visual(visual)
            return visual.to_dict()
        try:
            result = MiniMaxImageClient().generate(prompt, aspect_ratio=request.aspect_ratio)
        except ProviderConfigurationError:
            visual = _fallback_visual(saved_chart, prompt, config, provider_configured=False)
            active_store.save_visual(visual)
            return visual.to_dict()
        except ProviderError:
            visual = _fallback_visual(saved_chart, prompt, config, provider_configured=True)
            active_store.save_visual(visual)
            return visual.to_dict()
        visual = GeneratedVisual(
            image_id=f"image_{uuid4().hex}",
            chart_id=request.chart_id,
            provider=result.provider,
            model=result.model,
            prompt=prompt,
            image_url=result.image_url,
            fallback_bodygraph_svg_url=saved_chart.bodygraph_svg_url,
            provider_configured=True,
            created_at_utc=utc_now_iso(),
        )
        active_store.save_visual(visual)
        return visual.to_dict()

    return app


def _fallback_visual(
    saved_chart: SavedChart,
    prompt: str,
    config: dict[str, Any],
    *,
    provider_configured: bool,
) -> GeneratedVisual:
    return GeneratedVisual(
        image_id=f"image_{uuid4().hex}",
        chart_id=saved_chart.chart_id,
        provider="minimax",
        model=config.get("model"),
        prompt=prompt,
        image_url=None,
        fallback_bodygraph_svg_url=saved_chart.bodygraph_svg_url,
        provider_configured=provider_configured,
        created_at_utc=utc_now_iso(),
    )


def _compose_birth_datetime(birth_date: str, birth_time: str | None) -> str:
    if not birth_time:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "birth_time_required",
                "message": "正式人类图需要出生时间。仅生日可以进入低精度引导，但不能生成正式 BodyGraph。",
                "required_fields": ["birth_time"],
            },
        )
    try:
        parsed_date = date.fromisoformat(birth_date)
        parsed_time = time.fromisoformat(birth_time)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "birth_datetime_invalid", "message": "出生日期或时间格式不正确，请使用 YYYY-MM-DD 与 HH:MM。"},
        ) from exc
    return f"{parsed_date.isoformat()}T{parsed_time.isoformat()}"


def _report_config(report_type: str) -> dict[str, str]:
    config = REPORT_CONFIG.get(report_type)
    if config is None:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "report_type_invalid",
                "message": f"未知报告类型：{report_type}",
                "allowed": list(REPORT_CONFIG),
            },
        )
    return config


def _infer_focus(question: str) -> str:
    if any(keyword in question for keyword in ("天赋", "优势", "潜能", "使命", "主航道", "深挖", "挖掘")):
        return "talent"
    if any(keyword in question for keyword in ("职业", "工作", "赚钱", "收入", "方向", "事业")):
        return "career"
    if any(keyword in question for keyword in ("关系", "亲密", "伴侣", "沟通", "边界")):
        return "relationship"
    if any(keyword in question for keyword in ("决定", "要不要", "该不该", "选择", "时机")):
        return "decision"
    if any(keyword in question for keyword in ("身体", "能量", "中心", "通道", "闸门", "卡点", "淤堵", "内耗")):
        return "growth"
    return "overview"


def _generate_chat_answer(
    *,
    saved_chart: SavedChart,
    package,
    map_package,
    session: ChatSession,
    question: str,
    map_item_key: str | None,
    cognitive_runtime: SynthiaCognitiveRuntime,
) -> tuple[str, str, str | None, bool]:
    local_context = _fallback_map_answer(map_package, question, map_item_key)
    answer = cognitive_runtime.grounded_chat(
        question,
        context=local_context,
        source_ref=f"chart:{saved_chart.chart_id}:{map_package.map_type}",
        language="auto",
    )
    return _normalize_chat_answer(answer.text), "local-lcm", "synthia-lcm", True


def _build_deepseek_messages(
    saved_chart: SavedChart,
    package,
    map_package,
    session: ChatSession,
    question: str,
    map_item_key: str | None,
) -> list[dict[str, str]]:
    system = "\n".join(
        (
            package.system_prompt,
            "你现在面向简体中文用户，回答必须自然、具体、可执行。",
            "必须使用目标术语：荐骨中心、荐骨权威、阿姬娜中心、喉咙中心；不要使用骶骨中心、额骨中心、阿扎那。",
            "只能基于下方 chart facts、reading context 和历史会话作答；不知道就说明无法从当前图表推出。",
            "优先引用当前地图条目和资料依据；回答要像给用户看的解读，不要输出内部字段名。",
            "深度解读必须做结构叠加：不要只按人生角色、类型或单个闸门回答；要说明真实通道、已定义/开放中心、关键闸门如何共同作用。",
            "如果当前地图条目提供特质诊断层，必须基于活出来、盲区、卡住状态和卡住原因继续展开；不要复制卡片原文，要围绕用户问题生成新的深度回答。",
            "点击追问时，不能只补充当前卡片；至少联动两个其他结构，例如身体回应、开放中心、通道、人生角色、财富边界、关系模式或使命主题。",
            "回答要像一位成熟的人类图咨询师在继续聊天，不像报告、课程讲义或百科词条。",
            "不要把前面卡片重新整理一遍；每次只推进一层：更具体的现实场景、更尖锐的盲区、更可验证的练习，或一个能继续深聊的问题。",
            "如果用户的问题很大，先收窄到当下最关键的一层，并用一句话说明为什么先看这一层。",
            "先看身体真实反应，再看心理模式、关系环境和现实行动四层如何互相影响。",
            "内容底层可以吸收整合心理学、儒释道和佛法见地，但不要堆术语；要帮助用户少一点自我证明和执着，多一点鲜活、清醒、落地的生命力。",
            "当用户问天赋、使命、职业主航道或深挖时，必须输出具体天赋模块、误用方式、可观察练习，避免可套给所有人的建议。",
            "不要输出医疗、法律、财务或确定性命运承诺。",
            *package.assistant_instructions,
            "本轮聊天的最高优先级：不要输出 Markdown 标题、编号大纲、加粗符号、代码块或长列表。",
            "段落要短，每段 2-4 句；不要一次性给标准答案，最后只问 1 个能继续深入的具体问题。",
        )
    )
    context = _context_block_text(package)
    history = _chat_history_text(session)
    user = "\n\n".join(
        (
            f"用户问题：{question}",
            "【当前图表事实】\n" + _chart_fact_digest(saved_chart.chart),
            "【当前解读地图】\n" + map_context_text(map_package, selected_item_key=map_item_key),
            "【可引用解读上下文】\n" + context,
            "【本轮历史】\n" + history if history else "【本轮历史】\n暂无。",
            "请输出自然聊天文本，不要输出 Markdown。控制在 300-550 字。结构：先接住问题；再指出一个盘面机制；然后给一个现实验证练习；最后只问一个继续深聊的问题。",
        )
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def _context_block_text(package, *, max_chars: int = 14000) -> str:
    lines: list[str] = []
    for block in package.context_blocks:
        lines.append(f"## {block.title}")
        lines.append(block.content)
    text = "\n".join(lines).strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "\n\n[上下文已截断：请只基于已提供内容作答]"


def _chat_history_text(session: ChatSession, *, limit: int = 8) -> str:
    if not session.messages:
        return ""
    lines = []
    for message in session.messages[-limit:]:
        role = "用户" if message.role == "user" else "系统"
        lines.append(f"{role}: {message.content}")
    return "\n".join(lines)


def _chart_fact_digest(chart) -> str:
    summary = _display_summary(chart)
    defined_centers = [
        normalize_center_title(CENTER_LABELS.get(center.code, center.label))
        for center in chart.centers
        if center.defined
    ]
    open_centers = [
        normalize_center_title(CENTER_LABELS.get(center.code, center.label))
        for center in chart.centers
        if not center.defined
    ]
    channels = [f"{channel.code}「{display_channel_label(channel.code, channel.label)}」" for channel in chart.channels]
    gates = [
        f"{gate.gate}「{display_gate_theme(gate.gate, gate.theme)}」({normalize_center_title(CENTER_LABELS.get(gate.center, gate.center))})"
        for gate in chart.activated_gates
    ]
    return "\n".join(
        (
            f"类型：{summary['type']}",
            f"策略：{summary['strategy']}",
            f"权威：{summary['authority']}",
            f"人生角色：{summary['profile']}",
            f"定义：{summary['definition']}",
            f"签名/非自己主题：{summary['signature']} / {summary['not_self_theme']}",
            f"使命名称：{summary['incarnation_cross']}",
            "已定义中心：" + ("、".join(defined_centers) if defined_centers else "无"),
            "开放中心：" + ("、".join(open_centers) if open_centers else "无"),
            "通道：" + ("、".join(channels) if channels else "无"),
            "闸门：" + ("、".join(gates[:32]) if gates else "无"),
            f"输入时间：{chart.input.birth_datetime_local}，时区：{chart.input.timezone_name}",
        )
    )


def _fallback_with_provider_note(answer_markdown: str) -> str:
    note = (
        "\n\n当前外部问答服务暂时不可用，以下回答由本地结构化解读引擎生成，"
        "仍然基于当前图表事实。"
    )
    return answer_markdown.rstrip() + note


def _fallback_map_answer(map_package, question: str, map_item_key: str | None = None) -> str:
    items = _ordered_map_items(map_package, map_item_key)
    selected = items[0] if items else None
    supporting = items[1:3]
    lines = [f"你的问题：{question}", ""]
    if selected is not None:
        lines.append(
            f"我先不急着给标准答案。这个问题我会先看「{selected.title}」有没有在生活里被用对，"
            "因为人类图里很多困惑不是不知道，而是身体、关系和行动节奏没有对上。"
        )
        lines.append("")
        lines.append(_dialogue_pattern(selected, supporting))
        lines.append("")
        blind_spot = _first_item(selected.blind_spots)
        stuck = _first_item(selected.stuck_patterns)
        if blind_spot or stuck:
            lines.append(
                "盲区不是“你不懂”，而是你可能太快跳到解释，忽略身体已经给出的松紧感。"
                + (f" 盲区：{blind_spot}" if blind_spot else "")
                + (f" 卡住状态：{stuck}" if stuck else "")
            )
            lines.append("")
        cause = _first_item(selected.stuck_causes)
        if cause:
            lines.append(f"为什么会卡住，我会先看这里：{cause}")
            lines.append("")
        practice = _first_item(selected.practices)
        if practice:
            lines.append(f"先做一个小验证，不要急着想通：{practice}")
            lines.append("")
    if supporting:
        support_text = "；".join(f"{item.title}：{_first_sentence(item.user_language)}" for item in supporting)
        lines.append(f"我还会放在旁边一起看：{support_text} 这样就不是单点解释，而是看这个模式怎样牵动你的身体节奏、关系入口和现实选择。")
        lines.append("")
    facts = "；".join(_dialogue_fact_subset(map_package.professional_facts))
    if facts:
        lines.append(f"我看盘时抓的依据是：{facts}。")
        lines.append("")
    lines.append(f"我想继续问你：{_progressive_question(selected, question)}")
    return "\n".join(lines).strip() + "\n"


def _dialogue_pattern(item, supporting) -> str:
    if item.key == "talent.profile-24":
        base = (
            "你要找的不是一个全新的天赋，而是那个已经能做到80分、你却觉得太普通的能力。"
            "2爻容易低估自己天然会的东西，4爻又需要通过信任关系被看见；所以关键不是马上公开证明，"
            "而是先把这个80分能力练到100分，再让作品、案例和熟人网络把你召唤出来。"
        )
    else:
        alive = _first_item(item.embodied_expression)
        base = _trim_text(alive, 220) if alive else _first_sentence(item.user_language)
    if not supporting:
        return base
    support_titles = "、".join(next_item.title for next_item in supporting[:2])
    return f"{base} 这件事还会牵动 {support_titles}，所以不能只看单一特质，要看它怎样影响你的身体节奏、关系入口和现实选择。"


def _dialogue_fact_subset(facts: tuple[str, ...] | list[str]) -> list[str]:
    priority_prefixes = ("类型：", "权威：", "人生角色：", "定义：", "使命名称：", "已定义通道：")
    selected: list[str] = []
    for prefix in priority_prefixes:
        selected.extend(fact for fact in facts if fact.startswith(prefix))
    return selected[:6] or list(facts[:4])


def _next_followup(item, question: str) -> str:
    normalized_question = question.strip()
    for followup in item.followup_questions:
        if followup != normalized_question:
            return followup
    return ""


def _progressive_question(item, question: str) -> str:
    if item is None:
        return "这件事最近最具体发生在哪个场景，是工作、关系、钱，还是身体状态？"
    if item.key == "talent.profile-24":
        return "最近别人反复夸你、但你觉得“这有什么难的”的能力是哪一个？它现在有没有被你做成作品、案例或稳定服务？"
    if "02-14" in item.key or "02-14" in item.title:
        return "最近哪一个方向一想到就有身体力量，哪一个方向只是看起来有资源、但你身体并不想持续投入？"
    if item.key.startswith("wealth."):
        return "你现在赚钱最容易卡住的是定价、承诺、合作边界，还是不知道该把资源投向哪里？"
    if item.key.startswith("relationship."):
        return "你在关系里最常见的卡点，是太快答应、太晚表达边界，还是等对方看懂你？"
    if item.key.startswith("body."):
        return "最近一件让你身体变沉的事是什么？如果只看身体，不看道理，它在拒绝什么？"
    if item.key.startswith("mission."):
        return "你现在最想证明给别人看的东西是什么？如果先不证明，你真正想服务或创造的是什么？"
    next_followup = _next_followup(item, question)
    if next_followup:
        return next_followup
    return "如果只选一个现实场景继续拆，你想先看工作、关系、财富，还是身体能量？"


def _first_item(items) -> str:
    return items[0] if items else ""


def _consultant_summary(item) -> str:
    source = item.user_language.strip()
    if item.stuck_causes:
        source += " " + item.stuck_causes[0]
    return _trim_text(source, 460)


def _first_sentence(text: str) -> str:
    for marker in ("。", "；", "\n"):
        if marker in text:
            return text.split(marker, 1)[0].strip() + "。"
    return _trim_text(text, 120)


def _trim_text(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rstrip("，。；、 ") + "。"


def _normalize_chat_answer(text: str) -> str:
    cleaned_lines: list[str] = []
    for raw_line in text.replace("\r\n", "\n").split("\n"):
        line = raw_line.strip()
        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue
        if line.startswith("```"):
            continue
        line = line.lstrip("#").strip() if line.startswith("#") else line
        if line.startswith(">"):
            line = line.lstrip(">").strip()
        line = line.replace("**", "").replace("__", "").replace("`", "")
        for marker in ("- ", "* ", "• "):
            if line.startswith(marker):
                line = line[len(marker) :].strip()
                break
        cleaned_lines.append(line)
    normalized = "\n".join(cleaned_lines).strip()
    while "\n\n\n" in normalized:
        normalized = normalized.replace("\n\n\n", "\n\n")
    return normalized + ("\n" if normalized else "")


def _append_optional_markdown_list(lines: list[str], title: str, items) -> None:
    if not items:
        return
    lines.append(title)
    for item in items:
        lines.append(f"- {item}")
    lines.append("")


def _ordered_map_items(map_package, map_item_key: str | None):
    items = [item for section in map_package.sections for item in section.items]
    if not map_item_key:
        return items
    selected = [item for item in items if item.key == map_item_key]
    rest = [item for item in items if item.key != map_item_key]
    return selected + rest


def _build_visual_prompt(saved_chart: SavedChart, user_prompt: str | None) -> str:
    chart = saved_chart.chart
    summary = _display_summary(chart)
    defined_centers = [
        normalize_center_title(CENTER_LABELS.get(center.code, center.label))
        for center in chart.centers
        if center.defined
    ]
    open_centers = [
        normalize_center_title(CENTER_LABELS.get(center.code, center.label))
        for center in chart.centers
        if not center.defined
    ]
    channels = [f"{channel.code} {display_channel_label(channel.code, channel.label)}" for channel in chart.channels[:8]]
    custom = user_prompt.strip() if user_prompt and user_prompt.strip() else "身体能量解读封面"
    return (
        "生成一张适合中文人类图解读产品的高质感视觉封面图，风格成熟、干净、东方纸本质感、温暖大地色。"
        "不要生成密集文字，不要生成错误的人类图闸门数字，不要画医学器官，不要画真实人物照片。"
        "可以用抽象几何、九个能量中心的柔和轮廓、红黑能量线、纸张纹理、细腻光影表达。"
        f"主题：{custom}。"
        f"图表事实：类型 {summary['type']}，策略 {summary['strategy']}，权威 {summary['authority']}，"
        f"人生角色 {summary['profile']}，定义 {summary['definition']}。"
        f"已定义中心：{'、'.join(defined_centers) if defined_centers else '无'}。"
        f"开放中心：{'、'.join(open_centers) if open_centers else '无'}。"
        f"主要通道：{'、'.join(channels) if channels else '无'}。"
        "画面目标：不是正式排盘图，而是报告封面/能量视觉；正式 BodyGraph 会由系统模板另行渲染。"
    )


def _compose_export_markdown(
    answer_markdown: str,
    body_energy: dict[str, Any] | None,
    deep_synthesis: dict[str, Any] | None = None,
) -> str:
    if not body_energy and not deep_synthesis:
        return answer_markdown
    lines = [answer_markdown.strip()]
    if deep_synthesis:
        lines.extend(("", "## 天赋深挖补充"))
        lines.append(str(deep_synthesis["thesis"]))
        lines.append("")
        lines.append(f"结构公式：{deep_synthesis['structure_formula']}")
        lines.append("")
        lines.append("### 非泛化检查")
        for item in deep_synthesis["non_genericity_checks"]:
            lines.append(f"- {item}")
        lines.append("")
        lines.append("### 30 天实验")
        for item in deep_synthesis["suggested_experiments"]:
            lines.append(f"- {item}")
    if body_energy:
        lines.extend(("", "## 身体资源与能量管理补充"))
        lines.append(str(body_energy["summary"]))
        lines.append("")
        lines.append("### 九大中心")
        for item in body_energy["center_notes"]:
            lines.append(
                f"- {item['label']}（{item['state_label']}）：{item['body_resource']} "
                f"消耗模式：{item['consumption_pattern']} 练习：{item['practice']}"
            )
        lines.append("")
        lines.append("### 能量管理")
        for item in body_energy["energy_management"]:
            lines.append(f"- {item}")
    return "\n".join(lines).strip() + "\n"


def _display_summary(chart) -> dict[str, str]:
    return {
        "type": display_type(chart.summary.type.code, chart.summary.type.label),
        "strategy": display_strategy(chart.summary.strategy.code, chart.summary.strategy.label),
        "authority": display_authority(chart.summary.authority.code, chart.summary.authority.label),
        "profile": display_profile(chart.summary.profile.code, chart.summary.profile.label),
        "definition": display_definition(chart.summary.definition.code, chart.summary.definition.label),
        "signature": display_signature(chart.summary.signature.code, chart.summary.signature.label),
        "not_self_theme": display_not_self(chart.summary.not_self_theme.code, chart.summary.not_self_theme.label),
        "incarnation_cross": display_incarnation_cross(chart.summary.incarnation_cross.code, chart.summary.incarnation_cross.label),
    }


_semantic_db_path = Path(
    os.getenv(
        "BIVERSE_SEMANTIC_DB",
        str(Path.cwd() / "data" / "semantic-graph.sqlite3"),
    )
)
_semantic_db_path.parent.mkdir(parents=True, exist_ok=True)
app = create_app(semantic_graph=SemanticGraph(_semantic_db_path))
