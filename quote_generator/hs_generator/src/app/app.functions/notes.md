altertnative way to fetch needed ids:

    const new_results_res = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${objectId}/associations/${toObjectType}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const new_results = await new_results_res.json();
    const listIds =
      new_results?.results?.map((result) => result.toObjectId) || [];

Needed data:
// const objectType = "0-3";
// const toObjectType = "2-41599976";
