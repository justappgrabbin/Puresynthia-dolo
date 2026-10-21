# main.py
import streamlit as st
import numpy as np
from datetime import datetime, timedelta
from universe_core import Universe, ChartMode, ContextType
from circle_organ import CircleOrgan
import random

# ============================================================================
# SEED DATA GENERATOR
# ============================================================================

def seed_universe(universe: Universe, n_users: int = 10):
    """Create diverse pseudo-users for testing"""
    
    archetypes = [
        ("Visionary", [1, 43, 14, 34], [0.8, 0.3, 0.6, 0.2, 0.4, 0.1, 0.2, 0.5, 0.9]),
        ("Builder", [5, 15, 52, 53], [0.2, 0.2, 0.3, 0.8, 0.7, 0.9, 0.8, 0.3, 0.2]),
        ("Connector", [7, 31, 33, 45], [0.4, 0.5, 0.9, 0.6, 0.8, 0.4, 0.5, 0.4, 0.3]),
        ("Oracle", [11, 13, 25, 51], [0.7, 0.6, 0.5, 0.3, 0.4, 0.2, 0.3, 0.8, 0.9]),
        ("Curator", [16, 48, 57, 64], [0.6, 0.4, 0.7, 0.7, 0.5, 0.3, 0.4, 0.6, 0.5]),
    ]
    
    locations = ["NYC", "LA", "SF", "Austin", "Portland", "Denver", "Seattle", "Miami"]
    chart_modes = [ChartMode.SIDEREAL, ChartMode.TROPICAL, ChartMode.DRACONIC]
    
    created_users = []
    
    for i in range(n_users):
        archetype_name, base_gates, base_vector = random.choice(archetypes)
        
        # Add some variance
        gates = base_gates.copy()
        if random.random() > 0.5:
            gates.append(random.randint(1, 64))
        
        vector = np.array(base_vector) + np.random.normal(0, 0.1, 9)
        vector = np.clip(vector, 0, 1)  # keep in valid range
        
        # Random birth data
        year = random.randint(1980, 2000)
        month = random.randint(1, 12)
        day = random.randint(1, 28)
        
        user = universe.create_indiverse(
            hd_gates=gates,
            body_vector=vector,
            chart_mode=random.choice(chart_modes),
            birth_data={
                "date": f"{year}-{month:02d}-{day:02d}",
                "time": f"{random.randint(0,23):02d}:{random.randint(0,59):02d}",
                "location": random.choice(locations)
            },
            user_id=f"{archetype_name.lower()}_{i}"
        )
        
        # Set some initial state variance
        universe.update_state(
            user.id,
            energy_capacity=random.uniform(0.6, 1.0),
            momentum=random.uniform(0, 0.8),
            coherence_score=random.uniform(0.4, 0.9)
        )
        
        # Add archetype to patterns
        user.patterns.archetype_blend = {archetype_name: 1.0}
        
        created_users.append((archetype_name, user))
    
    return created_users


# ============================================================================
# HIVE ORGAN - ECONOMIC PROJECT GENERATOR
# ============================================================================

class HiveOrgan:
    """Economic expression layer - generates micro-apps and tracks outcomes"""
    
    PROJECT_TEMPLATES = {
        "oracle_tool": {
            "name": "Oracle Tool",
            "description": "AI-powered insight generator",
            "estimated_days": 21,
            "revenue_potential": (500, 3000)
        },
        "booking_system": {
            "name": "Booking System",
            "description": "Consultation scheduling app",
            "estimated_days": 14,
            "revenue_potential": (800, 2500)
        },
        "content_portal": {
            "name": "Content Portal",
            "description": "Membership site with resources",
            "estimated_days": 30,
            "revenue_potential": (1000, 5000)
        },
        "community_space": {
            "name": "Community Space",
            "description": "Discussion forum + resource library",
            "estimated_days": 45,
            "revenue_potential": (1500, 8000)
        }
    }
    
    def __init__(self, universe: Universe):
        self.universe = universe
        self.active_projects = {}
    
    def generate_project_suggestion(self, user_a_id: str, user_b_id: str):
        """Suggest project based on user archetypes"""
        user_a = self.universe.get_indiverse(user_a_id)
        user_b = self.universe.get_indiverse(user_b_id)
        
        # Simple logic: pick project based on archetype blend
        archetypes = []
        if user_a and user_a.patterns.archetype_blend:
            archetypes.extend(user_a.patterns.archetype_blend.keys())
        if user_b and user_b.patterns.archetype_blend:
            archetypes.extend(user_b.patterns.archetype_blend.keys())
        
        # Map archetypes to projects
        if "Oracle" in archetypes or "Visionary" in archetypes:
            return "oracle_tool"
        elif "Builder" in archetypes:
            return "booking_system"
        elif "Connector" in archetypes:
            return "community_space"
        else:
            return "content_portal"
    
    def launch_project(self, connection_id: str, project_type: str):
        """Create economic container for this connection"""
        template = self.PROJECT_TEMPLATES[project_type]
        
        project = {
            "connection_id": connection_id,
            "type": project_type,
            "template": template,
            "started": datetime.now(),
            "estimated_completion": datetime.now() + timedelta(days=template["estimated_days"]),
            "status": "active",
            "revenue": 0
        }
        
        self.active_projects[connection_id] = project
        
        # Record in Universe
        self.universe.record_interaction(
            connection_id,
            "project_launch",
            {
                "project_type": project_type,
                "template": template["name"],
                "estimated_days": template["estimated_days"]
            }
        )
        
        return project
    
    def simulate_outcome(self, connection_id: str):
        """Simulate project completion for demo"""
        project = self.active_projects.get(connection_id)
        if not project:
            return None
        
        template = project["template"]
        
        # Simulate outcome
        revenue = random.randint(*template["revenue_potential"])
        coherence = random.uniform(0.6, 0.95)
        completion = random.random() > 0.2  # 80% completion rate
        
        project["status"] = "completed" if completion else "abandoned"
        project["revenue"] = revenue if completion else 0
        
        # Record outcome in Universe
        self.universe.record_outcome(
            connection_id,
            {
                "revenue": project["revenue"],
                "completion": completion,
                "coherence": coherence,
                "engagement": random.uniform(0.7, 0.95)
            }
        )
        
        # Award credits
        if completion:
            connection = self.universe.connections.get(connection_id)
            if connection:
                credit_amount = 100 + (revenue / 50)  # base + performance bonus
                self.universe.award_credits(connection.user_a_id, credit_amount, "project_completion")
                self.universe.award_credits(connection.user_b_id, credit_amount, "project_completion")
        
        return project


# ============================================================================
# STREAMLIT UI
# ============================================================================

st.set_page_config(page_title="Resonance Network", page_icon="🌌", layout="wide")

# Initialize Universe and Hive
if "universe" not in st.session_state:
    st.session_state.universe = Universe()
    st.session_state.hive = HiveOrgan(st.session_state.universe)
    st.session_state.circle = CircleOrgan(st.session_state.universe)
    st.session_state.seeded = False

universe = st.session_state.universe
hive = st.session_state.hive
circle = st.session_state.circle

# Seed on first run
if not st.session_state.seeded:
    seed_users = seed_universe(universe, n_users=10)
    st.session_state.seed_users = seed_users
    st.session_state.seeded = True

# ============================================================================
# MAIN UI
# ============================================================================

st.title("🌌 Resonance Network")
st.caption("Universe → Indiverse → Hive: where resonance becomes economic expression")

# Sidebar navigation
page = st.sidebar.radio("Navigate", [
    "🪶 Create Indiverse", 
    "🔮 Find Matches", 
    "🏗️ Hive Projects", 
    "🎨 Circle Projects",
    "📊 Network Stats"
])

# ============================================================================
# PAGE 1: CREATE INDIVERSE
# ============================================================================

if page == "🪶 Create Indiverse":
    st.header("Create Your Indiverse")
    
    with st.expander("📚 Existing Test Users (for matching)"):
        if "seed_users" in st.session_state:
            for archetype, user in st.session_state.seed_users[:5]:
                st.write(f"**{archetype}** ({user.id})")
    
    col1, col2 = st.columns(2)
    birth_date = col1.date_input("Birth Date")
    birth_time = col2.time_input("Birth Time")
    birth_location = st.text_input("Birth Location", "San Francisco")
    
    hd_gates_input = st.text_input("Human Design Gates (comma-separated)", "1,13,25,51")
    gates = [int(x.strip()) for x in hd_gates_input.split(",") if x.strip().isdigit()]
    
    st.write("**Body Vector** (quick sliders for prototype)")
    body_cols = st.columns(9)
    body_labels = ["Crown", "3rd Eye", "Throat", "Heart", "Solar", "Sacral", "Root", "Spleen", "G"]
    body_vector = []
    for i, (col, label) in enumerate(zip(body_cols, body_labels)):
        val = col.slider(label, 0.0, 1.0, 0.5, key=f"body_{i}")
        body_vector.append(val)
    
    body_vector = np.array(body_vector)
    
    chart_mode = st.selectbox("Chart Mode", [ChartMode.SIDEREAL, ChartMode.TROPICAL, ChartMode.DRACONIC])
    
    if st.button("✨ Generate My Indiverse"):
        birth_data = {
            "date": str(birth_date),
            "time": str(birth_time),
            "location": birth_location
        }
        
        user = universe.create_indiverse(
            hd_gates=gates,
            body_vector=body_vector,
            chart_mode=chart_mode,
            birth_data=birth_data
        )
        
        st.success(f"✅ Indiverse created: **{user.id}**")
        st.session_state.current_user = user.id
        
        # Show signature
        st.subheader("Your Resonance Signature")
        st.write(f"**Gates:** {user.signature.hd_gates}")
        st.write(f"**Dominant Body:** {body_labels[np.argmax(user.signature.body_vector)]}")
        st.write(f"**Chart Mode:** {user.signature.chart_mode.value}")

# ============================================================================
# PAGE 2: FIND MATCHES
# ============================================================================

elif page == "🔮 Find Matches":
    st.header("Find Matches in the Hive")
    
    if "current_user" not in st.session_state:
        st.warning("⚠️ Create your Indiverse first or select a test user")
        
        # Quick select test user
        if "seed_users" in st.session_state:
            test_user_options = {f"{arch} ({user.id})": user.id 
                               for arch, user in st.session_state.seed_users}
            selected = st.selectbox("Or use test user:", list(test_user_options.keys()))
            if st.button("Use This Test User"):
                st.session_state.current_user = test_user_options[selected]
                st.rerun()
    else:
        user = universe.get_indiverse(st.session_state.current_user)
        st.write(f"**Your Indiverse:** {user.id}")
        
        col1, col2 = st.columns([2, 1])
        
        context_choice = col1.selectbox(
            "Context",
            [ContextType.ECONOMIC, ContextType.CREATIVE, ContextType.RELATIONAL],
            format_func=lambda c: c.value.title()
        )
        
        n_matches = col2.number_input("Results", 3, 10, 5)
        
        # Flow preference
        st.write("**Flow Preference** (how you want to connect)")
        flow_cols = st.columns(3)
        resonant = flow_cols[0].slider("🔊 Resonant (harmonic)", 0.0, 1.0, 0.33)
        complementary = flow_cols[1].slider("🧩 Complementary (filling)", 0.0, 1.0, 0.33)
        catalytic = flow_cols[2].slider("⚡ Catalytic (tension)", 0.0, 1.0, 0.34)
        
        # Normalize
        total = resonant + complementary + catalytic
        if total > 0:
            flow_pref = (resonant/total, complementary/total, catalytic/total)
        else:
            flow_pref = None
        
        if st.button("🔍 Find Resonances", type="primary"):
            with st.spinner("Scanning the Universe..."):
                matches = universe.find_matches(
                    st.session_state.current_user,
                    context=context_choice,
                    n=n_matches,
                    flow_preference=flow_pref
                )
            
            if not matches:
                st.warning("No matches found. Try different flow preferences or add more users.")
            else:
                st.success(f"Found {len(matches)} potential connections")
                
                for i, m in enumerate(matches):
                    with st.expander(f"**Match #{i+1}: {m.partner.id}** (score: {m.score:.3f})"):
                        col1, col2 = st.columns([2, 1])
                        
                        with col1:
                            st.write(f"**Reasoning:** {m.reasoning}")
                            st.write(f"**Flow Vector:**")
                            st.write(f"- 🔊 Resonant: {m.flow_vector[0]:.2f}")
                            st.write(f"- 🧩 Complementary: {m.flow_vector[1]:.2f}")
                            st.write(f"- ⚡ Catalytic: {m.flow_vector[2]:.2f}")
                            
                            archetype = list(m.partner.patterns.archetype_blend.keys())[0] if m.partner.patterns.archetype_blend else "Unknown"
                            st.write(f"**Archetype:** {archetype}")
                        
                        with col2:
                            st.metric("Energy", f"{m.partner.state.energy_capacity:.0%}")
                            st.metric("Coherence", f"{m.partner.state.coherence_score:.0%}")
                            
                            # Different buttons for different contexts
                            if context_choice == ContextType.ECONOMIC:
                                if st.button(f"🤝 Connect (Hive)", key=f"connect_hive_{i}"):
                                    # Create connection
                                    connection = universe.create_connection(
                                        st.session_state.current_user,
                                        m.partner.id,
                                        context_choice,
                                        m.flow_vector
                                    )
                                    
                                    # Generate Hive project
                                    project_type = hive.generate_project_suggestion(
                                        st.session_state.current_user,
                                        m.partner.id
                                    )
                                    
                                    project = hive.launch_project(connection.id, project_type)
                                    
                                    st.success(f"🎉 Hive project '{project['template']['name']}' launched!")
                                    st.balloons()
                            
                            elif context_choice == ContextType.CREATIVE:
                                if st.button(f"🎨 Connect (Circle)", key=f"connect_circle_{i}"):
                                    # Create connection
                                    connection = universe.create_connection(
                                        st.session_state.current_user,
                                        m.partner.id,
                                        context_choice,
                                        m.flow_vector
                                    )
                                    
                                    # Generate Circle project
                                    project_type = circle.suggest_project(
                                        st.session_state.current_user,
                                        m.partner.id
                                    )
                                    
                                    project = circle.launch_project(connection.id, project_type)
                                    
                                    st.success(f"🎉 Circle project '{project['template']['name']}' launched!")
                                    st.balloons()
                            
                            else:  # RELATIONAL or other
                                if st.button(f"🤝 Connect", key=f"connect_general_{i}"):
                                    connection = universe.create_connection(
                                        st.session_state.current_user,
                                        m.partner.id,
                                        context_choice,
                                        m.flow_vector
                                    )
                                    st.success("🎉 Connection established!")
                                    st.balloons()

# ============================================================================
# PAGE 3: HIVE PROJECTS (ECONOMIC)
# ============================================================================

elif page == "🏗️ Hive Projects":
    st.header("Hive Projects (Economic)")
    
    if not hive.active_projects:
        st.info("💡 No economic projects yet. Find matches with ECONOMIC context and connect!")
    else:
        for conn_id, project in hive.active_projects.items():
            connection = universe.connections.get(conn_id)
            
            with st.expander(f"**{project['template']['name']}** ({project['status']})"):
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    st.write(f"**Description:** {project['template']['description']}")
                    st.write(f"**Partners:** {connection.user_a_id} + {connection.user_b_id}")
                    st.write(f"**Started:** {project['started'].strftime('%Y-%m-%d')}")
                    st.write(f"**Est. Completion:** {project['estimated_completion'].strftime('%Y-%m-%d')}")
                    
                    if project['status'] == 'completed':
                        st.success(f"💰 Revenue: ${project['revenue']}")
                    elif project['status'] == 'abandoned':
                        st.warning("⚠️ Project abandoned")
                
                with col2:
                    if project['status'] == 'active':
                        if st.button("🎲 Simulate Completion", key=f"sim_hive_{conn_id}"):
                            outcome = hive.simulate_outcome(conn_id)
                            if outcome['status'] == 'completed':
                                st.success(f"✅ Completed! Revenue: ${outcome['revenue']}")
                            else:
                                st.warning("⚠️ Abandoned")
                            st.rerun()

# ============================================================================
# PAGE 4: CIRCLE PROJECTS (CREATIVE)
# ============================================================================

elif page == "🎨 Circle Projects":
    st.header("Circle Projects (Creative)")
    
    if not circle.active_projects:
        st.info("💡 No creative projects yet. Find matches with CREATIVE context and connect!")
    else:
        for conn_id, project in circle.active_projects.items():
            connection = universe.connections.get(conn_id)
            
            with st.expander(f"**{project['template']['name']}** ({project['status']})"):
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    st.write(f"**Description:** {project['template']['description']}")
                    st.write(f"**Partners:** {connection.user_a_id} + {connection.user_b_id}")
                    st.write(f"**Started:** {project['started'].strftime('%Y-%m-%d')}")
                    st.write(f"**Est. Completion:** {project['estimated_completion'].strftime('%Y-%m-%d')}")
                    st.write(f"**Coherence Potential:** {project['template']['coherence_potential'][0]:.0%} - {project['template']['coherence_potential'][1]:.0%}")
                    
                    if project['status'] == 'completed':
                        st.success("✨ Creative success! High coherence achieved.")
                    elif project['status'] == 'abandoned':
                        st.warning("⚠️ Project abandoned")
                
                with col2:
                    if project['status'] == 'active':
                        if st.button("🎲 Simulate Completion", key=f"sim_circle_{conn_id}"):
                            outcome = circle.simulate_outcome(conn_id)
                            if outcome['status'] == 'completed':
                                st.success("✅ Creative breakthrough achieved!")
                                st.balloons()
                            else:
                                st.warning("⚠️ Abandoned")
                            st.rerun()

# ============================================================================
# PAGE 5: NETWORK STATS
# ============================================================================

elif page == "📊 Network Stats":
    st.header("Universe Statistics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    col1.metric("Total Indiverses", len(universe.indiverses))
    col2.metric("Active Connections", len(universe.connections))
    
    hive_count = len(hive.active_projects)
    circle_count = len(circle.active_projects)
    col3.metric("Hive Projects", hive_count)
    col4.metric("Circle Projects", circle_count)
    
    total_credits = sum(u.resonance_credits for u in universe.indiverses.values())
    st.metric("Total Credits Awarded", f"{total_credits:.0f}")
    
    # Show organ breakdown
    st.subheader("Organ Activity")
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**🏗️ Hive (Economic)**")
        st.write(f"- Active: {sum(1 for p in hive.active_projects.values() if p['status'] == 'active')}")
        st.write(f"- Completed: {sum(1 for p in hive.active_projects.values() if p['status'] == 'completed')}")
        total_revenue = sum(p.get('revenue', 0) for p in hive.active_projects.values())
        st.write(f"- Total Revenue: ${total_revenue:,.0f}")
    
    with col2:
        st.write("**🎨 Circle (Creative)**")
        st.write(f"- Active: {sum(1 for p in circle.active_projects.values() if p['status'] == 'active')}")
        st.write(f"- Completed: {sum(1 for p in circle.active_projects.values() if p['status'] == 'completed')}")
        st.write(f"- Focus: Coherence over revenue")
    
    st.divider()
    
    st.subheader("Top Contributors")
    
    # Sort by network value
    sorted_users = sorted(
        universe.indiverses.values(),
        key=lambda u: universe.calculate_network_value(u.id),
        reverse=True
    )[:5]
    
    for user in sorted_users:
        archetype = list(user.patterns.archetype_blend.keys())[0] if user.patterns.archetype_blend else "Unknown"
        network_value = universe.calculate_network_value(user.id)
        
        st.write(f"**{user.id}** ({archetype})")
        st.write(f"- Credits: {user.resonance_credits:.0f}")
        st.write(f"- Network Value: {network_value:.2f}")
        st.write(f"- Success Contexts: {', '.join(user.patterns.success_contexts) or 'None yet'}")
        st.divider()
    
    st.subheader("Learning Progress")
    st.write(f"Outcome data collected: {len(universe.outcome_data)} records")
    
    if st.button("🧠 Retrain Matcher"):
        universe.retrain_matcher()
        st.success("Matching weights updated based on outcome data")

# ============================================================================
# SIDEBAR CONTROLS
# ============================================================================

st.sidebar.title("🗺 Universe Controls")

if st.sidebar.button("💾 Save State"):
    universe.save_state("universe_state.json")
    st.sidebar.success("✅ Universe saved")

if st.sidebar.button("📂 Load State"):
    try:
        universe.load_state("universe_state.json")
        st.sidebar.success("✅ Universe loaded")
    except FileNotFoundError:
        st.sidebar.error("No saved state found")

if st.sidebar.button("🔄 Reset Universe"):
    st.session_state.clear()
    st.rerun()

st.sidebar.divider()
st.sidebar.caption("🌌 Universe → Indiverse")
st.sidebar.caption("🏗️ Hive (economic) | 🎨 Circle (creative)")
st.sidebar.caption("v0.2 - Multi-Organ Prototype")