// Fixtures modeled on the actual field shapes each source returns.
// Includes a deliberate duplicate (the replenishment manager appears in
// both JSearch and Adzuna) and two honesty-flag cases.

export const jsearchResponse = {
  status: "OK",
  data: [
    {
      job_id: "js-001",
      job_title: "Replenishment Manager",
      employer_name: "Hasbro",
      job_city: "Bentonville",
      job_state: "AR",
      job_country: "US",
      job_posted_at_datetime_utc: "2026-06-20T00:00:00.000Z",
      job_apply_link: "https://careers.hasbro.com/jobs/js-001",
      job_description:
        "Manage Walmart facing replenishment using Retail Link. Build replenishment plans from retailer projections. Power BI and SQL reporting. Analyze inventory and in stock performance.",
    },
    {
      job_id: "js-002",
      job_title: "Sr Demand Planning Manager",
      employer_name: "Acme Foods",
      job_city: "Rogers",
      job_state: "AR",
      job_country: "US",
      job_posted_at_datetime_utc: "2026-06-22T00:00:00.000Z",
      job_apply_link: "https://acmefoods.com/careers/js-002",
      job_description:
        "Own demand forecasting. Build statistical forecast models from scratch and develop new machine learning forecasting algorithms. Tableau dashboards required.",
    },
    {
      job_id: "js-003",
      job_title: "VP of Supply Chain",
      employer_name: "Globex",
      job_city: "Dallas",
      job_state: "TX",
      job_country: "US",
      job_posted_at_datetime_utc: "2026-06-18T00:00:00.000Z",
      job_apply_link: "https://globex.com/careers/js-003",
      job_description:
        "Executive leadership of end to end supply chain across North America. Fifteen plus years leadership required.",
    },
  ],
};

export const adzunaResponse = {
  results: [
    {
      id: "az-100",
      title: "Replenishment Manager",
      company: { display_name: "Hasbro" },
      location: { display_name: "Bentonville, AR" },
      created: "2026-06-20T00:00:00Z",
      redirect_url: "https://adzuna.com/land/ad/az-100",
      description:
        "Walmart facing replenishment role using Retail Link and Power BI. Translate projections into replenishment plans.",
    },
    {
      id: "az-101",
      title: "Inventory Management Analyst",
      company: { display_name: "Sam's Club" },
      location: { display_name: "Bentonville, AR" },
      created: "2026-06-23T00:00:00Z",
      redirect_url: "https://adzuna.com/land/ad/az-101",
      description:
        "Inventory analysis with SQL and Power BI. Support in stock and replenishment for club channel. Excel modeling.",
    },
  ],
};

export const workdayResponse = {
  jobPostings: [
    {
      title: "Manager, Inventory Management",
      externalPath: "/job/Bentonville/Manager-Inventory-Management/wd-555",
      locationsText: "Bentonville, AR",
      postedOn: "Posted 3 Days Ago",
      bulletFields: [
        "Lead inventory management for a merchandise category",
        "Retail Link, Power BI, SQL",
      ],
    },
  ],
};
