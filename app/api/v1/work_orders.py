import math
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_manager, get_db
from app.models.employee import Employee
from app.models.work_order import WorkOrder
from app.schemas.work_order import WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse
from app.services.audit_service import log_audit_event

router = APIRouter()

class OptimizeRouteRequest(BaseModel):
    employee_id: str
    origin_latitude: float
    origin_longitude: float

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c

@router.post("/", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_work_order(
    payload: WorkOrderCreate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Creates a new delivery/work order.
    """
    # Enforce assigned employee belongs to the same tenant if provided
    if payload.employee_id:
        emp = db.query(Employee).filter(
            Employee.id == payload.employee_id,
            Employee.company_id == current_user.company_id
        ).first()
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Assigned employee does not belong to your company."
            )

    new_order = WorkOrder(
        company_id=current_user.company_id,
        employee_id=payload.employee_id,
        client_name=payload.client_name,
        address=payload.address,
        destination_latitude=payload.destination_latitude,
        destination_longitude=payload.destination_longitude,
        status="PENDING"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Log to audit trail
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="CREATE",
        table_name="work_orders",
        record_id=new_order.id,
        old_values=None,
        new_values={
            "client_name": new_order.client_name,
            "address": new_order.address,
            "destination_latitude": new_order.destination_latitude,
            "destination_longitude": new_order.destination_longitude,
            "employee_id": new_order.employee_id
        },
        user_id=current_user.id
    )

    return new_order

@router.get("/", response_model=List[WorkOrderResponse])
def list_work_orders(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Lists work orders belonging to the company, with optional filters.
    """
    query = db.query(WorkOrder).filter(WorkOrder.company_id == current_user.company_id)
    if employee_id:
        query = query.filter(WorkOrder.employee_id == employee_id)
    if status:
        query = query.filter(WorkOrder.status == status)
    
    # Order by route_order, then creation time
    return query.order_by(WorkOrder.route_order.asc(), WorkOrder.created_at.asc()).all()

@router.put("/{order_id}", response_model=WorkOrderResponse)
def update_work_order(
    order_id: str,
    payload: WorkOrderUpdate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Modifies a work order.
    """
    order = db.query(WorkOrder).filter(
        WorkOrder.id == order_id,
        WorkOrder.company_id == current_user.company_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found or unauthorized access."
        )

    old_values = {
        "client_name": order.client_name,
        "address": order.address,
        "employee_id": order.employee_id,
        "status": order.status,
        "route_order": order.route_order,
        "delivery_notes": order.delivery_notes
    }

    # Validate target employee
    if payload.employee_id and payload.employee_id != order.employee_id:
        emp = db.query(Employee).filter(
            Employee.id == payload.employee_id,
            Employee.company_id == current_user.company_id
        ).first()
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned employee does not belong to your company."
            )
        order.employee_id = payload.employee_id
    elif payload.employee_id == "":
        order.employee_id = None

    if payload.client_name is not None:
        order.client_name = payload.client_name
    if payload.address is not None:
        order.address = payload.address
    if payload.destination_latitude is not None:
        order.destination_latitude = payload.destination_latitude
    if payload.destination_longitude is not None:
        order.destination_longitude = payload.destination_longitude
    if payload.status is not None:
        order.status = payload.status
        if payload.status in ["COMPLETED", "FAILED"]:
            order.completed_at = datetime.now(timezone.utc)
    if payload.route_order is not None:
        order.route_order = payload.route_order
    if payload.delivery_notes is not None:
        order.delivery_notes = payload.delivery_notes
    if payload.verified_latitude is not None:
        order.verified_latitude = payload.verified_latitude
    if payload.verified_longitude is not None:
        order.verified_longitude = payload.verified_longitude
    if payload.gps_verified is not None:
        order.gps_verified = payload.gps_verified

    db.commit()
    db.refresh(order)

    # Log to audit trail
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="UPDATE",
        table_name="work_orders",
        record_id=order.id,
        old_values=old_values,
        new_values={
            "client_name": order.client_name,
            "address": order.address,
            "employee_id": order.employee_id,
            "status": order.status,
            "route_order": order.route_order,
            "delivery_notes": order.delivery_notes
        },
        user_id=current_user.id
    )

    return order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_order(
    order_id: str,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Deletes a work order.
    """
    order = db.query(WorkOrder).filter(
        WorkOrder.id == order_id,
        WorkOrder.company_id == current_user.company_id
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found or unauthorized access."
        )

    old_values = {
        "client_name": order.client_name,
        "address": order.address,
        "employee_id": order.employee_id,
        "status": order.status
    }

    db.delete(order)
    db.commit()

    # Log to audit trail
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="DELETE",
        table_name="work_orders",
        record_id=order_id,
        old_values=old_values,
        new_values=None,
        user_id=current_user.id
    )

@router.post("/optimize", response_model=List[WorkOrderResponse])
def optimize_route(
    payload: OptimizeRouteRequest,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Optimizes the delivery route (TSP - Traveling Salesperson Problem) for a specific driver's PENDING tasks.
    Uses Nearest Neighbor heuristic starting from the origin coordinates (e.g. company headquarters).
    """
    # Verify driver is in the same company
    driver = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found in your company."
        )

    # Get all pending work orders for this driver
    orders = db.query(WorkOrder).filter(
        WorkOrder.employee_id == payload.employee_id,
        WorkOrder.company_id == current_user.company_id,
        WorkOrder.status == "PENDING"
    ).all()

    if not orders:
        return []

    # Nearest Neighbor routing algorithm
    unvisited = list(orders)
    current_lat = payload.origin_latitude
    current_lon = payload.origin_longitude
    
    route_index = 1
    optimized_route = []

    while unvisited:
        # Find nearest unvisited stop
        nearest_order = None
        min_distance = float('inf')
        
        for order in unvisited:
            dist = haversine_distance(
                current_lat, current_lon,
                order.destination_latitude, order.destination_longitude
            )
            if dist < min_distance:
                min_distance = dist
                nearest_order = order
                
        # Assign route order index
        nearest_order.route_order = route_index
        route_index += 1
        
        # Move current location to this stop
        current_lat = nearest_order.destination_latitude
        current_lon = nearest_order.destination_longitude
        
        optimized_route.append(nearest_order)
        unvisited.remove(nearest_order)

    # Save changes to DB
    db.commit()
    
    # Return the route sorted by route_order
    return sorted(optimized_route, key=lambda x: x.route_order)
