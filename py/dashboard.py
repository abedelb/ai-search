import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

# Page configuration
st.set_page_config(
    page_title="Pipeline Monitor",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for distinctive aesthetics with BNP Paribas colors
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Manrope:wght@300;400;600;800&display=swap');
    
    /* Global styles */
    * {
        font-family: 'Manrope', sans-serif;
    }
    
    .main {
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
        padding: 2rem;
    }
    
    /* Header with BNP Paribas Green */
    .pipeline-header {
        background: linear-gradient(135deg, #007348 0%, #008755 50%, #00a678 100%);
        padding: 2rem 2.5rem;
        border-radius: 20px;
        margin-bottom: 2rem;
        box-shadow: 0 10px 40px rgba(0, 135, 85, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .pipeline-title {
        font-family: 'Space Mono', monospace;
        font-size: 2.8rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        letter-spacing: -1px;
        text-transform: uppercase;
    }
    
    .pipeline-subtitle {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 0.5rem;
        font-weight: 300;
        letter-spacing: 1px;
    }
    
    /* Metric cards */
    .metric-card {
        background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4a 100%);
        padding: 1.8rem;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        height: 100%;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 48px rgba(0, 166, 120, 0.3);
        border-color: rgba(0, 166, 120, 0.4);
    }
    
    .metric-label {
        font-size: 0.85rem;
        color: #a0a0c0;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        font-weight: 600;
        margin-bottom: 0.8rem;
    }
    
    .metric-value {
        font-family: 'Space Mono', monospace;
        font-size: 2.5rem;
        font-weight: 700;
        color: #ffffff;
        line-height: 1;
        margin-bottom: 0.5rem;
    }
    
    .metric-delta {
        font-size: 0.9rem;
        font-weight: 500;
        margin-top: 0.5rem;
    }
    
    .metric-delta.positive {
        color: #00a678;
    }
    
    .metric-delta.negative {
        color: #f44336;
    }
    
    /* Chart containers */
    .chart-container {
        background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4a 100%);
        padding: 1.5rem;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        margin-bottom: 1.5rem;
    }
    
    .chart-title {
        font-family: 'Space Mono', monospace;
        font-size: 1.1rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    /* Status badges with BNP Paribas colors */
    .status-badge {
        display: inline-block;
        padding: 0.4rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin: 0.2rem;
    }
    
    .status-discovered {
        background: rgba(141, 201, 171, 0.2);
        color: #8dc9ab;
        border: 1px solid rgba(141, 201, 171, 0.3);
    }
    
    .status-parsed {
        background: rgba(0, 156, 109, 0.2);
        color: #009c6d;
        border: 1px solid rgba(0, 156, 109, 0.3);
    }
    
    .status-indexed {
        background: rgba(0, 166, 120, 0.2);
        color: #00a678;
        border: 1px solid rgba(0, 166, 120, 0.3);
    }
    
    .status-failed {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
        border: 1px solid rgba(244, 67, 54, 0.3);
    }
    
    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Streamlit metric styling override */
    [data-testid="stMetricValue"] {
        font-family: 'Space Mono', monospace;
        font-size: 2rem;
        color: #ffffff;
    }
    
    [data-testid="stMetricLabel"] {
        font-size: 0.85rem;
        color: #a0a0c0;
        text-transform: uppercase;
        letter-spacing: 1.5px;
    }
    
    [data-testid="stMetricDelta"] {
        color: #00a678;
    }
</style>
""", unsafe_allow_html=True)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'your_database',
    'user': 'your_username',
    'password': 'your_password'
}

# Mock mode flag - Set to False when using real database
USE_MOCK_DATA = True

def get_db_connection():
    """Create a PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        st.error(f"Database connection failed: {e}")
        return None

@st.cache_data(ttl=300)  # Cache for 5 minutes
def load_data_from_db():
    """Load data from PostgreSQL database"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        query = """
        SELECT 
            id,
            name,
            sector,
            sub_sector,
            business_lead,
            client_name,
            status,
            size_mb,
            parsing_started_at,
            parsing_ended_at,
            indexing_ended_at,
            discovered_at
        FROM t_document_doc
        WHERE parsing_started_at IS NOT NULL
        ORDER BY parsing_started_at DESC
        """
        
        df = pd.read_sql(query, conn)
        
        # Calculate parsing time
        df['parsing_time_seconds'] = (
            pd.to_datetime(df['parsing_ended_at']) - 
            pd.to_datetime(df['parsing_started_at'])
        ).dt.total_seconds()
        
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return None
    finally:
        conn.close()

@st.cache_data
def generate_mock_data():
    """Generate mock data matching the t_document_doc table structure"""
    np.random.seed(42)
    
    # Generate timestamps for the last 30 days
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)
    
    num_docs = 2000
    
    # Sectors and sub-sectors
    sectors = ['Finance', 'Healthcare', 'Technology', 'Manufacturing', 'Retail']
    sub_sectors = {
        'Finance': ['Banking', 'Insurance', 'Investment', 'Accounting'],
        'Healthcare': ['Hospitals', 'Pharma', 'Medical Devices', 'Clinics'],
        'Technology': ['Software', 'Hardware', 'Cloud', 'AI/ML'],
        'Manufacturing': ['Automotive', 'Aerospace', 'Electronics', 'Food'],
        'Retail': ['E-commerce', 'Fashion', 'Grocery', 'Consumer Goods']
    }
    
    business_leads = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Eve Davis']
    client_names = [
        'Acme Corp', 'TechStart Inc', 'Global Industries', 'Innovation Labs',
        'Future Systems', 'Premier Group', 'NextGen Solutions', 'Alpha Partners'
    ]
    
    # Document statuses
    statuses = np.random.choice(
        ['discovered', 'parsed', 'indexed', 'failed'],
        size=num_docs,
        p=[0.10, 0.25, 0.55, 0.10]
    )
    
    # Generate base timestamps
    discovered_timestamps = pd.date_range(start=start_time, end=end_time, periods=num_docs)
    
    # Document sizes (in MB) - log-normal distribution
    sizes = np.random.lognormal(mean=2, sigma=1.5, size=num_docs)
    sizes = np.clip(sizes, 0.1, 100)  # Clip between 0.1 and 100 MB
    
    # Parsing times (seconds) - correlated with size
    parsing_started = discovered_timestamps + pd.to_timedelta(np.random.uniform(1, 30, num_docs), unit='m')
    parsing_time = sizes * 0.5 + np.random.normal(2, 1, num_docs)
    parsing_time = np.clip(parsing_time, 0.5, 120)  # Between 0.5 and 120 seconds
    parsing_ended = parsing_started + pd.to_timedelta(parsing_time, unit='s')
    
    # Indexing times
    indexing_ended = parsing_ended + pd.to_timedelta(np.random.uniform(1, 15, num_docs), unit='s')
    
    # Set None for documents that haven't reached certain stages
    # Convert to list for easier manipulation
    parsing_ended_list = parsing_ended.tolist()
    indexing_ended_list = indexing_ended.tolist()
    
    for i, status in enumerate(statuses):
        if status == 'discovered':
            parsing_ended_list[i] = pd.NaT
            indexing_ended_list[i] = pd.NaT
        elif status in ['parsed', 'failed']:
            indexing_ended_list[i] = pd.NaT
    
    # Convert back to Series
    parsing_ended_clean = pd.Series(parsing_ended_list)
    indexing_ended_clean = pd.Series(indexing_ended_list)
    
    # Generate sectors and corresponding sub-sectors
    doc_sectors = np.random.choice(sectors, size=num_docs)
    doc_sub_sectors = [np.random.choice(sub_sectors[sector]) for sector in doc_sectors]
    
    df = pd.DataFrame({
        'id': [i + 1 for i in range(num_docs)],
        'name': [f'Document_{i:05d}_{np.random.choice(["Report", "Analysis", "Contract", "Proposal"])}.pdf' 
                 for i in range(num_docs)],
        'sector': doc_sectors,
        'sub_sector': doc_sub_sectors,
        'business_lead': np.random.choice(business_leads, size=num_docs),
        'client_name': np.random.choice(client_names, size=num_docs),
        'status': statuses,
        'size_mb': sizes,
        'discovered_at': discovered_timestamps,
        'parsing_started_at': parsing_started,
        'parsing_ended_at': parsing_ended_clean,
        'indexing_ended_at': indexing_ended_clean,
        'parsing_time_seconds': parsing_time
    })
    
    return df

# Load data
if USE_MOCK_DATA:
    df = generate_mock_data()
    st.sidebar.success("📊 Using Mock Data")
else:
    df = load_data_from_db()
    if df is None or df.empty:
        st.error("Unable to load data from database. Please check your connection settings.")
        st.stop()
    st.sidebar.success("🔌 Connected to Database")

# Sidebar filters
st.sidebar.title("🔍 Filters")

# Sector filter
sectors = ['All'] + sorted(df['sector'].unique().tolist())
selected_sector = st.sidebar.selectbox("Sector", sectors)

# Business Lead filter
leads = ['All'] + sorted(df['business_lead'].unique().tolist())
selected_lead = st.sidebar.selectbox("Business Lead", leads)

# Client filter
clients = ['All'] + sorted(df['client_name'].unique().tolist())
selected_client = st.sidebar.selectbox("Client", clients)

# Date range filter
date_range = st.sidebar.date_input(
    "Date Range",
    value=(df['discovered_at'].min().date(), df['discovered_at'].max().date()),
    min_value=df['discovered_at'].min().date(),
    max_value=df['discovered_at'].max().date()
)

# Apply filters
filtered_df = df.copy()

if selected_sector != 'All':
    filtered_df = filtered_df[filtered_df['sector'] == selected_sector]

if selected_lead != 'All':
    filtered_df = filtered_df[filtered_df['business_lead'] == selected_lead]

if selected_client != 'All':
    filtered_df = filtered_df[filtered_df['client_name'] == selected_client]

if len(date_range) == 2:
    start_date, end_date = date_range
    filtered_df = filtered_df[
        (filtered_df['discovered_at'].dt.date >= start_date) &
        (filtered_df['discovered_at'].dt.date <= end_date)
    ]

# Refresh button
if st.sidebar.button("🔄 Refresh Data"):
    st.cache_data.clear()
    st.rerun()

# Header
st.markdown("""
<div class="pipeline-header">
    <h1 class="pipeline-title">⚡ Pipeline Monitor</h1>
    <p class="pipeline-subtitle">Real-time data pipeline monitoring & analytics</p>
</div>
""", unsafe_allow_html=True)

# Top metrics row
col1, col2, col3, col4 = st.columns(4)

# Calculate metrics
total_docs = len(filtered_df)
discovered_docs = len(filtered_df[filtered_df['status'] == 'discovered'])
parsed_docs = len(filtered_df[filtered_df['status'] == 'parsed'])
indexed_docs = len(filtered_df[filtered_df['status'] == 'indexed'])
failed_docs = len(filtered_df[filtered_df['status'] == 'failed'])

with col1:
    st.metric(
        label="📊 DISCOVERED",
        value=f"{discovered_docs:,}",
        delta=f"{discovered_docs/total_docs*100:.1f}%" if total_docs > 0 else "0%"
    )

with col2:
    st.metric(
        label="📝 PARSED",
        value=f"{parsed_docs:,}",
        delta=f"{parsed_docs/total_docs*100:.1f}%" if total_docs > 0 else "0%"
    )

with col3:
    st.metric(
        label="✅ INDEXED",
        value=f"{indexed_docs:,}",
        delta=f"{indexed_docs/total_docs*100:.1f}%" if total_docs > 0 else "0%"
    )

with col4:
    st.metric(
        label="❌ FAILED",
        value=f"{failed_docs:,}",
        delta=f"-{failed_docs/total_docs*100:.1f}%" if total_docs > 0 else "0%",
        delta_color="inverse"
    )

st.markdown("<br>", unsafe_allow_html=True)

# Main content area
col_left, col_right = st.columns([1, 1])

with col_left:
    # 1. Documents per Status (Pie Chart) - BNP Colors
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<h3 class="chart-title">📋 Document Distribution by Status</h3>', unsafe_allow_html=True)
    
    status_counts = filtered_df['status'].value_counts()
    
    fig_status = go.Figure(data=[go.Pie(
        labels=status_counts.index,
        values=status_counts.values,
        hole=0.5,
        marker=dict(
            colors=['#8dc9ab', '#009c6d', '#00a678', '#f44336'],
            line=dict(color='#1e1e3f', width=3)
        ),
        textfont=dict(size=14, family='Space Mono', color='white'),
        hovertemplate='<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>'
    )])
    
    fig_status.update_layout(
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5,
            font=dict(size=12, color='#a0a0c0')
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=400,
        margin=dict(t=20, b=80, l=20, r=20),
        annotations=[dict(
            text=f'<b>{total_docs:,}</b><br><span style="font-size:12px">TOTAL</span>',
            x=0.5, y=0.5,
            font=dict(size=24, family='Space Mono', color='white'),
            showarrow=False
        )]
    )
    
    st.plotly_chart(fig_status, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col_right:
    # 3. Error Analysis - BNP Colors
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<h3 class="chart-title">⚠️ Error Rate Analysis</h3>', unsafe_allow_html=True)
    
    # Group errors by hour
    df_failed = filtered_df[filtered_df['status'] == 'failed'].copy()
    if len(df_failed) > 0:
        df_failed['hour'] = pd.to_datetime(df_failed['parsing_started_at']).dt.floor('H')
        errors_per_hour = df_failed.groupby('hour').size().reset_index(name='error_count')
        
        # Create all hours in range
        all_hours = pd.date_range(
            start=filtered_df['parsing_started_at'].min().floor('H'),
            end=filtered_df['parsing_started_at'].max().ceil('H'),
            freq='H'
        )
        errors_per_hour = errors_per_hour.set_index('hour').reindex(all_hours, fill_value=0).reset_index()
        errors_per_hour.columns = ['hour', 'error_count']
    else:
        errors_per_hour = pd.DataFrame({'hour': [], 'error_count': []})
    
    fig_errors = go.Figure()
    
    fig_errors.add_trace(go.Bar(
        x=errors_per_hour['hour'],
        y=errors_per_hour['error_count'],
        marker=dict(
            color=errors_per_hour['error_count'],
            colorscale=[[0, '#2a2a4a'], [0.5, '#8dc9ab'], [1, '#f44336']],
            line=dict(color='#f44336', width=1)
        ),
        hovertemplate='<b>%{x|%Y-%m-%d %H:%M}</b><br>Errors: %{y}<extra></extra>'
    ))
    
    fig_errors.update_layout(
        xaxis=dict(
            title='Time',
            showgrid=True,
            gridcolor='rgba(255,255,255,0.05)',
            color='#a0a0c0'
        ),
        yaxis=dict(
            title='Error Count',
            showgrid=True,
            gridcolor='rgba(255,255,255,0.05)',
            color='#a0a0c0'
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=400,
        margin=dict(t=20, b=60, l=60, r=20),
        showlegend=False,
        hovermode='x unified'
    )
    
    st.plotly_chart(fig_errors, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# 2. Documents Indexed per Hour - BNP Colors
st.markdown('<div class="chart-container">', unsafe_allow_html=True)
st.markdown('<h3 class="chart-title">📈 Documents Indexed per Hour</h3>', unsafe_allow_html=True)

# Group indexed documents by hour
df_indexed = filtered_df[filtered_df['status'] == 'indexed'].copy()
if len(df_indexed) > 0:
    df_indexed['hour'] = pd.to_datetime(df_indexed['indexing_ended_at']).dt.floor('H')
    indexed_per_hour = df_indexed.groupby('hour').size().reset_index(name='count')

    # Create continuous hourly range
    all_hours = pd.date_range(
        start=df_indexed['indexing_ended_at'].min().floor('H'),
        end=df_indexed['indexing_ended_at'].max().ceil('H'),
        freq='H'
    )
    indexed_per_hour = indexed_per_hour.set_index('hour').reindex(all_hours, fill_value=0).reset_index()
    indexed_per_hour.columns = ['hour', 'count']

    # Calculate moving average
    indexed_per_hour['moving_avg'] = indexed_per_hour['count'].rolling(window=3, min_periods=1).mean()
else:
    indexed_per_hour = pd.DataFrame({'hour': [], 'count': [], 'moving_avg': []})

fig_indexed = go.Figure()

# Area chart for actual counts - BNP Green
fig_indexed.add_trace(go.Scatter(
    x=indexed_per_hour['hour'],
    y=indexed_per_hour['count'],
    fill='tozeroy',
    name='Indexed Docs',
    line=dict(color='#00a678', width=2),
    fillcolor='rgba(0, 166, 120, 0.2)',
    hovertemplate='<b>%{x|%Y-%m-%d %H:%M}</b><br>Indexed: %{y}<extra></extra>'
))

# Moving average line - BNP Dark Green
fig_indexed.add_trace(go.Scatter(
    x=indexed_per_hour['hour'],
    y=indexed_per_hour['moving_avg'],
    name='3hr Moving Avg',
    line=dict(color='#007348', width=2, dash='dash'),
    hovertemplate='<b>%{x|%Y-%m-%d %H:%M}</b><br>Avg: %{y:.1f}<extra></extra>'
))

fig_indexed.update_layout(
    xaxis=dict(
        title='Time',
        showgrid=True,
        gridcolor='rgba(255,255,255,0.05)',
        color='#a0a0c0'
    ),
    yaxis=dict(
        title='Documents Indexed',
        showgrid=True,
        gridcolor='rgba(255,255,255,0.05)',
        color='#a0a0c0'
    ),
    paper_bgcolor='rgba(0,0,0,0)',
    plot_bgcolor='rgba(0,0,0,0)',
    height=400,
    margin=dict(t=20, b=60, l=60, r=20),
    legend=dict(
        orientation="h",
        yanchor="bottom",
        y=1.02,
        xanchor="right",
        x=1,
        font=dict(size=12, color='#a0a0c0')
    ),
    hovermode='x unified'
)

st.plotly_chart(fig_indexed, use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

# 4. Parsing Time by Document Size - BNP Colors
st.markdown('<div class="chart-container">', unsafe_allow_html=True)
st.markdown('<h3 class="chart-title">⏱️ Average Parsing Time by Document Size</h3>', unsafe_allow_html=True)

# Create 10MB buckets
df_parsed_complete = filtered_df[
    (filtered_df['status'].isin(['parsed', 'indexed'])) & 
    (filtered_df['parsing_time_seconds'].notna())
].copy()

if len(df_parsed_complete) > 0:
    df_parsed_complete['size_bucket'] = (df_parsed_complete['size_mb'] // 10) * 10

    # Calculate average parsing time per bucket
    parsing_stats = df_parsed_complete.groupby('size_bucket').agg({
        'parsing_time_seconds': ['mean', 'std', 'count']
    }).reset_index()

    parsing_stats.columns = ['size_bucket', 'avg_time', 'std_time', 'count']
    parsing_stats = parsing_stats[parsing_stats['count'] >= 5]  # Only show buckets with 5+ documents

    # Create bucket labels
    parsing_stats['bucket_label'] = parsing_stats['size_bucket'].apply(
        lambda x: f'{int(x)}-{int(x+10)}MB'
    )
else:
    parsing_stats = pd.DataFrame(columns=['size_bucket', 'avg_time', 'std_time', 'count', 'bucket_label'])

fig_parsing = go.Figure()

if len(parsing_stats) > 0:
    # Bar chart with error bars - BNP Green gradient
    fig_parsing.add_trace(go.Bar(
        x=parsing_stats['bucket_label'],
        y=parsing_stats['avg_time'],
        error_y=dict(
            type='data',
            array=parsing_stats['std_time'],
            color='rgba(0, 135, 72, 0.5)',
            thickness=1.5
        ),
        marker=dict(
            color=parsing_stats['avg_time'],
            colorscale=[[0, '#8dc9ab'], [0.5, '#00a678'], [1, '#007348']],
            colorbar=dict(
                title='Avg Time (s)',
                titlefont=dict(color='#a0a0c0'),
                tickfont=dict(color='#a0a0c0')
            ),
            line=dict(color='rgba(255,255,255,0.2)', width=1)
        ),
        text=parsing_stats['count'],
        texttemplate='n=%{text}',
        textposition='outside',
        textfont=dict(size=10, color='#a0a0c0'),
        hovertemplate='<b>%{x}</b><br>Avg Time: %{y:.2f}s<br>Documents: %{text}<extra></extra>'
    ))

fig_parsing.update_layout(
    xaxis=dict(
        title='Document Size Range',
        showgrid=False,
        color='#a0a0c0'
    ),
    yaxis=dict(
        title='Average Parsing Time (seconds)',
        showgrid=True,
        gridcolor='rgba(255,255,255,0.05)',
        color='#a0a0c0'
    ),
    paper_bgcolor='rgba(0,0,0,0)',
    plot_bgcolor='rgba(0,0,0,0)',
    height=400,
    margin=dict(t=40, b=60, l=60, r=20),
    showlegend=False
)

st.plotly_chart(fig_parsing, use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

# Additional Analytics Section
st.markdown("<br>", unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    # Sector breakdown - BNP Colors
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<h3 class="chart-title">🏢 Documents by Sector</h3>', unsafe_allow_html=True)
    
    sector_counts = filtered_df['sector'].value_counts().head(10)
    
    fig_sector = go.Figure(data=[go.Bar(
        x=sector_counts.values,
        y=sector_counts.index,
        orientation='h',
        marker=dict(
            color=sector_counts.values,
            colorscale=[[0, '#8dc9ab'], [0.5, '#00a678'], [1, '#007348']],
            line=dict(color='rgba(255,255,255,0.2)', width=1)
        ),
        hovertemplate='<b>%{y}</b><br>Documents: %{x}<extra></extra>'
    )])
    
    fig_sector.update_layout(
        xaxis=dict(title='Number of Documents', showgrid=True, gridcolor='rgba(255,255,255,0.05)', color='#a0a0c0'),
        yaxis=dict(showgrid=False, color='#a0a0c0'),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=350,
        margin=dict(t=20, b=60, l=120, r=20),
        showlegend=False
    )
    
    st.plotly_chart(fig_sector, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    # Business Lead Performance - BNP Colors
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<h3 class="chart-title">👥 Performance by Business Lead</h3>', unsafe_allow_html=True)
    
    lead_stats = filtered_df.groupby('business_lead').agg({
        'id': 'count',
        'status': lambda x: (x == 'indexed').sum()
    }).reset_index()
    lead_stats.columns = ['business_lead', 'total', 'indexed']
    lead_stats['success_rate'] = (lead_stats['indexed'] / lead_stats['total'] * 100).round(1)
    lead_stats = lead_stats.sort_values('total', ascending=True).tail(10)
    
    fig_lead = go.Figure()
    
    fig_lead.add_trace(go.Bar(
        x=lead_stats['total'],
        y=lead_stats['business_lead'],
        orientation='h',
        name='Total',
        marker=dict(color='#009c6d', line=dict(color='rgba(255,255,255,0.2)', width=1)),
        hovertemplate='<b>%{y}</b><br>Total: %{x}<extra></extra>'
    ))
    
    fig_lead.add_trace(go.Bar(
        x=lead_stats['indexed'],
        y=lead_stats['business_lead'],
        orientation='h',
        name='Indexed',
        marker=dict(color='#00a678', line=dict(color='rgba(255,255,255,0.2)', width=1)),
        hovertemplate='<b>%{y}</b><br>Indexed: %{x}<extra></extra>'
    ))
    
    fig_lead.update_layout(
        barmode='overlay',
        xaxis=dict(title='Number of Documents', showgrid=True, gridcolor='rgba(255,255,255,0.05)', color='#a0a0c0'),
        yaxis=dict(showgrid=False, color='#a0a0c0'),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=350,
        margin=dict(t=20, b=60, l=120, r=20),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=12, color='#a0a0c0')
        )
    )
    
    st.plotly_chart(fig_lead, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# Footer with summary stats
st.markdown("<br>", unsafe_allow_html=True)
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    success_rate = (indexed_docs / total_docs * 100) if total_docs > 0 else 0
    st.metric("✨ Success Rate", f"{success_rate:.1f}%")

with col2:
    if len(df_parsed_complete) > 0:
        avg_parsing_time = df_parsed_complete['parsing_time_seconds'].mean()
        st.metric("⚡ Avg Parsing Time", f"{avg_parsing_time:.2f}s")
    else:
        st.metric("⚡ Avg Parsing Time", "N/A")

with col3:
    avg_doc_size = filtered_df['size_mb'].mean()
    st.metric("📦 Avg Document Size", f"{avg_doc_size:.2f} MB")

with col4:
    total_hours = (filtered_df['discovered_at'].max() - filtered_df['discovered_at'].min()).total_seconds() / 3600
    docs_per_hour = total_docs / total_hours if total_hours > 0 else 0
    st.metric("🚀 Throughput", f"{docs_per_hour:.1f} docs/hr")

with col5:
    unique_clients = filtered_df['client_name'].nunique()
    st.metric("🏢 Active Clients", f"{unique_clients}")

# Data table at the bottom (optional - can be hidden in expander)
with st.expander("📊 View Raw Data", expanded=False):
    st.dataframe(
        filtered_df[['id', 'name', 'sector', 'business_lead', 'client_name', 'status', 
                     'size_mb', 'parsing_time_seconds']].head(100),
        use_container_width=True
    )